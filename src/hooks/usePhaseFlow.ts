'use client';

import { useState, useCallback, useEffect, useRef } from "react";
import type { GenerativeSection } from "@/types/flow";
import { informTele, teleAcknowledge } from "@/utils/teleUtils";
import { getVisitorSession, saveVisitorSession } from "@/utils/visitorMemory";
import { categorizeFit } from "@/utils/categorizeFit";
import { generateAiSummary, generateAiGapInsight } from "@/utils/jobInsights";
import type { SkillRef, SkillGapRef } from "@/utils/jobInsights";
import {
  fetchCandidate,
  fetchJobs,
  syncLearningState,
  resolveJobsArray,
  patchSiteFunctions,
} from "@/platform/mcpBridge";
import { readCache, loadIntoCache as loadIntoCacheBridge } from "@/platform/mcpCacheBridge";
import { useTeleSpeech } from "@/hooks/useTeleSpeech";
import { EVENT_NAVIGATE_POP_JOB_BROWSE } from "@/utils/teleUtils";
import { registerSiteFunctions } from "@/site-functions/register";

const INITIAL_SECTIONS: GenerativeSection[] = [
  { id: "welcome", templateId: "WelcomeLanding", props: {} },
];

const WAIT_FOR_USER_TEMPLATES = new Set([
  "GlassmorphicOptions",
  "MultiSelectOptions",
  "RegistrationForm",
  "CardStack",
  "SavedJobsStack",
  "Dashboard",
  "CandidateSheet",
  "JobCandidateView",
]);

function shouldDisableNewResponse(sections: GenerativeSection[]): boolean {
  return sections.some((s) => WAIT_FOR_USER_TEMPLATES.has(s.templateId));
}

function getActiveMultiSelectFingerprint(sections: GenerativeSection[]): string | null {
  for (let i = sections.length - 1; i >= 0; i--) {
    const s = sections[i];
    if (s.templateId !== "MultiSelectOptions") continue;
    const id = typeof s.id === "string" ? s.id : "";
    const step = s.props?.progressStep;
    if (typeof step === "number") return `${id}\0step:${step}`;
    const bubbles = s.props?.bubbles;
    if (Array.isArray(bubbles) && bubbles.length > 0) {
      const keys = bubbles
        .map((b) =>
          b && typeof b === "object" && b !== null && "label" in b
            ? String((b as { label: unknown }).label)
            : "",
        )
        .join("|");
      return `${id}\0bubbles:${keys}`;
    }
    return `${id}\0default`;
  }
  return null;
}

type UpdatableSection = GenerativeSection & { _update?: boolean };

const RESERVED_SECTION_KEYS = new Set([
  "id",
  "templateId",
  "props",
  "generativeSubsections",
  "value",
  "_update",
  "_sessionEstablished",
]);

function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function unwrapValuePayload(value: unknown): unknown {
  let current = value;
  for (let i = 0; i < 3; i++) {
    const obj = asObject(current);
    if (!obj) break;
    const inner = asObject(obj.value);
    if (!inner) break;
    const hasTopLevelSectionShape =
      "generativeSubsections" in obj || "templateId" in obj || "id" in obj;
    if (hasTopLevelSectionShape) break;
    current = inner;
  }
  return current;
}

function normalizeSection(raw: unknown, index: number): UpdatableSection | null {
  const obj = asObject(raw);
  if (!obj || typeof obj.templateId !== "string" || !obj.templateId.trim()) {
    return null;
  }

  const propsObj = asObject(obj.props) ?? {};
  const rootProps = Object.fromEntries(
    Object.entries(obj).filter(([key]) => !RESERVED_SECTION_KEYS.has(key))
  );

  return {
    id:
      typeof obj.id === "string" && obj.id.trim()
        ? obj.id
        : `${obj.templateId}-${Date.now()}-${index}`,
    templateId: obj.templateId,
    props: {
      ...rootProps,
      ...propsObj,
    },
    _update: obj._update === true,
  };
}

function extractIncomingSections(value: unknown): UpdatableSection[] {
  const unwrapped = unwrapValuePayload(value);

  if (Array.isArray(unwrapped)) {
    return unwrapped
      .map((entry, index) => normalizeSection(entry, index))
      .filter((s): s is UpdatableSection => !!s);
  }

  const obj = asObject(unwrapped);
  if (!obj) return [];

  if (Array.isArray(obj.generativeSubsections)) {
    return obj.generativeSubsections
      .map((entry, index) => normalizeSection(entry, index))
      .filter((s): s is UpdatableSection => !!s);
  }

  const single = normalizeSection(obj, 0);
  return single ? [single] : [];
}

function consumeSessionEstablished(sections: UpdatableSection[]): void {
  for (const section of sections) {
    const raw = section.props._sessionEstablished;
    if (raw && typeof raw === "object") {
      const { candidateId } = raw as { candidateId?: string };
      if (typeof candidateId === "string") {
        saveVisitorSession(candidateId);
      }
    }
    delete section.props._sessionEstablished;
  }
}

function normalizeNavigateToSectionPayload(args: unknown[]): unknown {
  if (args.length === 0) return null;
  if (args.length === 1) return args[0];

  const [badge, title, subtitle, generativeSubsections] = args;
  return {
    ...(typeof badge === "string" ? { badge } : {}),
    ...(typeof title === "string" ? { title } : {}),
    ...(typeof subtitle === "string" ? { subtitle } : {}),
    ...(generativeSubsections !== undefined ? { generativeSubsections } : {}),
  };
}

function mergeSection(base: GenerativeSection, incoming: UpdatableSection): GenerativeSection {
  return {
    id: incoming.id || base.id,
    templateId: incoming.templateId || base.templateId,
    props: {
      ...base.props,
      ...incoming.props,
    },
  };
}

function applyIncomingSections(
  prev: GenerativeSection[],
  incoming: UpdatableSection[]
): GenerativeSection[] {
  if (incoming.length === 0) return prev;

  const hasFullReplaceSection = incoming.some((s) => !s._update);
  const next = hasFullReplaceSection ? [] : [...prev];

  const findMatchIndex = (target: UpdatableSection): number => {
    if (target.id) {
      const byId = next.findIndex((s) => s.id === target.id);
      if (byId !== -1) return byId;
    }
    return next.findIndex((s) => s.templateId === target.templateId);
  };

  for (const section of incoming) {
    const matchInPrev = prev.find(
      (s) => s.id === section.id || s.templateId === section.templateId
    );

    if (section._update) {
      const matchIndex = findMatchIndex(section);
      if (matchIndex !== -1) {
        next[matchIndex] = mergeSection(next[matchIndex], section);
      } else if (matchInPrev) {
        next.push(mergeSection(matchInPrev, section));
      } else {
        next.push({
          id: section.id,
          templateId: section.templateId,
          props: section.props,
        });
      }
      continue;
    }

    if (matchInPrev) {
      next.push(mergeSection(matchInPrev, section));
    } else {
      next.push({
        id: section.id,
        templateId: section.templateId,
        props: section.props,
      });
    }
  }

  return next;
}

function sliceToJobBrowseAnchor(sections: GenerativeSection[]): GenerativeSection[] {
  const n = sections.length;
  if (n === 0) return sections;

  const top = sections[n - 1].templateId;
  if (top !== "JobDetailSheet" && top !== "EligibilitySheet") {
    return sections;
  }

  for (let i = n - 2; i >= 0; i--) {
    const tid = sections[i].templateId;
    if (tid === "JobSearchSheet" || tid === "SavedJobsStack") {
      return sections.slice(0, i + 1);
    }
  }
  return sections;
}

const TEMPLATES_NEEDING_JOBS = new Set([
  "CardStack",
  "CardStackJobPreviewSheet",
  "JobSearchSheet",
  "JobDetailSheet",
]);
const TEMPLATES_NEEDING_SKILLS = new Set(["ProfileSheet", "SkillCoverageSheet", "SkillsDetail", "SkillTestFlow", "TargetRoleSheet"]);
const TEMPLATES_NEEDING_CANDIDATE = new Set(["CandidateSheet", "ProfileSheet"]);
const TEMPLATES_NEEDING_CAREER_GROWTH = new Set(["CareerGrowthDetail", "CareerGrowthSheet"]);
const TEMPLATES_NEEDING_MARKET_RELEVANCE = new Set(["MarketRelevanceDetail", "MarketRelevanceSheet"]);

const DASHBOARD_COMPANION_TEMPLATES = new Set([
  "GlassmorphicOptions", "ProfileSheet", "SkillCoverageSheet",
  "JobSearchSheet", "JobDetailSheet", "EligibilitySheet",
  "CloseGapSheet", "JobApplicationsSheet", "PastApplicationsSheet",
  "SkillsDetail", "SkillTestFlow", "MarketRelevanceDetail", "CareerGrowthDetail",
  "MarketRelevanceSheet", "CareerGrowthSheet",
  "TargetRoleSheet", "MyLearningSheet",
  "SavedJobsStack",
]);

function buildJobLookupProps(props: Record<string, unknown>) {
  return { jobId: props.jobId, title: props.jobTitle, company: props.company };
}

function unwrapCandidate(cache: unknown): Record<string, unknown> | null {
  if (!cache || typeof cache !== "object") return null;
  const obj = cache as Record<string, unknown>;
  if (obj.name || obj.experience || obj.education) return obj;
  for (const key of ["data", "result"] as const) {
    const inner = obj[key];
    if (inner && typeof inner === "object") {
      const rec = inner as Record<string, unknown>;
      if (rec.name || rec.experience || rec.education) return rec;
    }
  }
  return obj;
}

function deriveCandidateTitle(cd: Record<string, unknown>): string | undefined {
  const exp = cd.experience;
  if (Array.isArray(exp) && exp.length > 0) {
    const entries = exp as Record<string, unknown>[];
    const current = entries.find((e) => e.is_current === true);
    if (current) return (current.title ?? current.role) as string | undefined;
    return (entries[0].title ?? entries[0].role) as string | undefined;
  }
  const prefs = cd.jobPreferences ?? cd.job_preferences;
  if (Array.isArray(prefs) && prefs.length > 0 && typeof prefs[0] === "string") {
    return prefs[0];
  }
  return undefined;
}

function formatSalaryRange(rec: Record<string, unknown>): string | undefined {
  const min = rec.salary_min ?? rec.salaryMin;
  const max = rec.salary_max ?? rec.salaryMax;
  if (min != null && max != null) {
    const fmt = (v: unknown) => Number(v).toLocaleString("en-US");
    return `${fmt(min)} – ${fmt(max)}`;
  }
  return (rec.salaryRange ?? rec.salary_range) as string | undefined;
}

function extractJobProps(rec: Record<string, unknown>): Record<string, unknown> {
  const inner =
    rec.job && typeof rec.job === "object"
      ? (rec.job as Record<string, unknown>)
      : rec;

  const id = (inner.job_id ?? inner.id ?? inner.jobId) as string | undefined;
  const matchScore = inner.match_score ?? rec.match_score ?? rec.score ?? inner.matchScore ?? rec.matchScore;
  const fitCategory =
    (inner.fitCategory ??
    inner.fit_category ??
    rec.fitCategory ??
    rec.fit_category ??
    (matchScore != null ? categorizeFit(matchScore as number).category : undefined)) as string | undefined;

  const requiredSkills = (inner.required_skills ?? inner.requiredSkills ?? []) as SkillRef[];
  const recommendedSkills = (inner.recommended_skills ?? inner.recommendedSkills ?? []) as SkillRef[];
  const skillGaps = (rec.skill_gaps ?? rec.skillGaps ?? inner.skill_gaps ?? inner.skillGaps ?? []) as SkillGapRef[];

  let aiSummary = (inner.aiSummary ?? inner.ai_summary) as string | undefined;
  let aiGapInsight = (inner.aiGapInsight ?? inner.ai_gap_insight ?? inner.gap_insight) as string | undefined;

  if (!aiSummary && fitCategory && (requiredSkills.length > 0 || skillGaps.length > 0)) {
    aiSummary = generateAiSummary(
      fitCategory as "good-fit" | "stretch" | "grow-into",
      requiredSkills,
      recommendedSkills,
      skillGaps,
    );
  }
  if (aiGapInsight === undefined && fitCategory && skillGaps.length > 0) {
    aiGapInsight = generateAiGapInsight(skillGaps, fitCategory as "good-fit" | "stretch" | "grow-into");
  }

  return {
    id,
    jobId: id,
    title: inner.title,
    company: inner.company_name ?? inner.company,
    location: inner.location,
    salaryRange: formatSalaryRange(inner),
    description: inner.description,
    matchScore,
    fitCategory,
    requiredSkills,
    recommendedSkills,
    skillGaps,
    aiSummary,
    aiGapInsight,
    postedAt: (inner.postedAt ?? inner.posted_at ?? "") as string,
  };
}

function lookupJobFromCache(
  props: Record<string, unknown>,
  cache: unknown,
): Record<string, unknown> | null {
  const arr = resolveJobsArray(cache);
  const jobId = props.jobId as string | undefined;
  const title = (props.title as string | undefined)?.toLowerCase();
  const company = (props.company as string | undefined)?.toLowerCase();

  if (jobId) {
    for (const item of arr) {
      if (!item || typeof item !== "object") continue;
      const rec = item as Record<string, unknown>;
      const inner =
        rec.job && typeof rec.job === "object"
          ? (rec.job as Record<string, unknown>)
          : rec;
      if ((inner.id ?? inner.job_id ?? inner.jobId) === jobId) return extractJobProps(rec);
    }
  }

  if (title) {
    for (const item of arr) {
      if (!item || typeof item !== "object") continue;
      const rec = item as Record<string, unknown>;
      const inner =
        rec.job && typeof rec.job === "object"
          ? (rec.job as Record<string, unknown>)
          : rec;
      const iTitle = (inner.title as string | undefined)?.toLowerCase();
      const iCompany = ((inner.company_name ?? inner.company) as string | undefined)?.toLowerCase();
      if (iTitle === title && (!company || iCompany === company)) {
        return extractJobProps(rec);
      }
    }
  }

  return null;
}

const NAVIGATE_DRIFT_TIMEOUT_MS = 15000;

export function usePhaseFlow() {
  const [generativeSubsections, setGenerativeSections] =
    useState<GenerativeSection[]>(INITIAL_SECTIONS);
  const lastParseNudgeAtRef = useRef(0);
  const lastNavigateAtRef = useRef(0);
  const driftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionsRef = useRef<GenerativeSection[]>(INITIAL_SECTIONS);
  const multiSelectSubmittedRef = useRef(false);
  const multiSelectStepKeyRef = useRef<string | null>(null);

  const navigateToSection = useCallback(
    (...args: unknown[]): boolean | { disableNewResponseCreation: boolean } => {
      try {
        console.log("[usePhaseFlow navigateToSection] Raw args received:", args);
        console.log("[usePhaseFlow navigateToSection] Args length:", args.length);
        
        const data = normalizeNavigateToSectionPayload(args);
        console.log("[usePhaseFlow navigateToSection] After normalization:", data);
        
        if (data == null) {
          console.warn("[usePhaseFlow navigateToSection] Data is null after normalization!");
          return false;
        }
        
        const parsed =
          typeof data === "object" && data !== null
            ? data
            : JSON.parse(data as string);
        console.log("[usePhaseFlow navigateToSection] Parsed data:", parsed);
        
        const incoming = extractIncomingSections(parsed);
        console.log("[usePhaseFlow navigateToSection] Extracted sections:", incoming);
        console.log("[usePhaseFlow navigateToSection] Sections count:", incoming.length);
        
        if (incoming.length > 0 && incoming[0]) {
          console.log("[usePhaseFlow navigateToSection] First section templateId:", incoming[0].templateId);
          console.log("[usePhaseFlow navigateToSection] First section props:", incoming[0].props);
        }
        
        if (incoming.length === 0) {
          console.warn("[usePhaseFlow navigateToSection] No sections extracted!");
          return false;
        }

        if (driftTimerRef.current) {
          clearTimeout(driftTimerRef.current);
          driftTimerRef.current = null;
        }

        lastNavigateAtRef.current = Date.now();

        consumeSessionEstablished(incoming);

        const prevHasCandidateSheet = sectionsRef.current.some(
          (s) => s.templateId === "CandidateSheet",
        );
        const incomingHasDashboard = incoming.some(
          (s) => s.templateId === "Dashboard",
        );
        const incomingHasCardStack = incoming.some(
          (s) => s.templateId === "CardStack",
        );
        if (
          prevHasCandidateSheet &&
          incomingHasDashboard &&
          !incomingHasCardStack
        ) {
          informTele(
            "[CORRECTION] On 'Looks Good' you MUST show CardStack first. Never go directly to Dashboard. " +
              "Call navigateToSection with CardStack now. Same response: speak the job-count lines and call navigateToSection with " +
              '{"badge":"MOBEUS CAREER","title":"Job Matches","subtitle":"Top recommendations","generativeSubsections":[{"id":"jobs","templateId":"CardStack","props":{}}]}.',
          );
          return { disableNewResponseCreation: true };
        }

        const prevHasCardStack = sectionsRef.current.some((s) => s.templateId === "CardStack");
        const prevHasJobSearch = sectionsRef.current.some((s) => s.templateId === "JobSearchSheet");
        const incomingHasJobDetail = incoming.some((s) => s.templateId === "JobDetailSheet");
        if (incomingHasJobDetail && prevHasCardStack && !prevHasJobSearch) {
          for (let i = incoming.length - 1; i >= 0; i--) {
            if (incoming[i].templateId === "JobDetailSheet") incoming.splice(i, 1);
          }
          if (incoming.length === 0) {
            informTele(
              "[SYSTEM] CardStack onboarding: the job preview sheet is already on screen. " +
                "Do NOT open JobDetailSheet. Acknowledge in one sentence only — no navigateToSection, no search_knowledge for JobDetailSheet, no get_career_growth for that purpose.",
            );
            return { disableNewResponseCreation: true };
          }
        }

        const incomingHasJobSearch = incoming.some((s) => s.templateId === "JobSearchSheet");
        if (incomingHasJobSearch && prevHasCardStack && !prevHasJobSearch) {
          for (let i = incoming.length - 1; i >= 0; i--) {
            if (incoming[i].templateId === "JobSearchSheet") incoming.splice(i, 1);
          }
          if (incoming.length === 0) {
            informTele(
              "[SYSTEM] CardStack onboarding is active. Do NOT show JobSearchSheet during onboarding. " +
                "The CardStack is already visible. Stay on CardStack until 'user tapped: cards'.",
            );
            return { disableNewResponseCreation: true };
          }
        }

        for (let i = incoming.length - 1; i >= 0; i--) {
          const sec = incoming[i];
          if (sec.templateId === "GlassmorphicOptions" && sec.id === "begin-cta") {
            incoming.splice(i, 1);
          }
        }

        if (getVisitorSession()) {
          const regIdx = incoming.findIndex((s) => s.templateId === "RegistrationForm");
          if (regIdx !== -1) {
            incoming.splice(regIdx, 1);
            if (!incoming.some((s) => s.templateId === "Dashboard")) {
              incoming.push({ id: "dashboard", templateId: "Dashboard", props: {} });
            }
          }
        }

        const cache = readCache();
        for (const s of incoming) {
          if (s.props?.rawSkillProgression) {
            const merged = {
              ...(cache.skills as Record<string, unknown> | null),
              ...(s.props.rawSkillProgression as Record<string, unknown>),
            };
            loadIntoCacheBridge("skills", merged);
            s.props = { ...s.props, rawSkillProgression: merged };
          }

          if (TEMPLATES_NEEDING_SKILLS.has(s.templateId) && !s.props?.rawSkillProgression && cache.skills) {
            s.props = { ...s.props, rawSkillProgression: cache.skills };
          }
          // Do not call fetchSkills here — hosted sites often lack POST /api/invoke/get_skill_progression.
          // Skill data: agent passes rawSkillProgression via navigateToSection (see prompts) or server tools.
          if (TEMPLATES_NEEDING_JOBS.has(s.templateId) && !s.props?.rawJobs && !s.props?.jobs) {
            if (cache.jobs) {
              const jobsArr = resolveJobsArray(cache.jobs);
              if (jobsArr.length > 0) {
                const normalized = jobsArr.map((item) =>
                  item && typeof item === "object"
                    ? extractJobProps(item as Record<string, unknown>)
                    : item,
                );
                const injected = s.templateId === "CardStack" ? normalized.slice(0, 3) : normalized;
                s.props = { ...s.props, jobs: injected };
              }
            } else {
              const sess = getVisitorSession();
              if (sess) fetchJobs(sess.candidateId);
            }
          }
          if (TEMPLATES_NEEDING_CANDIDATE.has(s.templateId)) {
            if (!cache.candidate) {
              const sess = getVisitorSession();
              if (sess) fetchCandidate(sess.candidateId);
            }
            if (cache.candidate) {
              const cd = unwrapCandidate(cache.candidate);
              if (cd) {
                const prefer = s.templateId === "ProfileSheet";
                const candidateName = (cd.name ?? cd.full_name ?? cd.display_name) as string | undefined;
                if (candidateName && (prefer || !s.props?.name))
                  s.props = { ...s.props, name: candidateName };
                const candidateTitle = (cd.title as string | undefined) ?? deriveCandidateTitle(cd);
                if (candidateTitle && (prefer || !s.props?.title))
                  s.props = { ...s.props, title: candidateTitle };
                if (cd.avatarUrl && (prefer || !s.props?.avatarUrl))
                  s.props = { ...s.props, avatarUrl: cd.avatarUrl as string };
                if (cd.avatar_url && (prefer || !s.props?.avatarUrl))
                  s.props = { ...s.props, avatarUrl: cd.avatar_url as string };
                if (!s.props?.experience && cd.experience) s.props = { ...s.props, experience: cd.experience };
                if (!s.props?.education && cd.education) s.props = { ...s.props, education: cd.education };
              }
            }
          }

          if (TEMPLATES_NEEDING_CAREER_GROWTH.has(s.templateId)) {
            if (cache.careerGrowth && !s.props?.rawCareerGrowth) {
              s.props = { ...s.props, rawCareerGrowth: cache.careerGrowth };
            }
          }
          if (TEMPLATES_NEEDING_MARKET_RELEVANCE.has(s.templateId)) {
            if (cache.marketRelevance && !s.props?.rawMarketRelevance) {
              s.props = { ...s.props, rawMarketRelevance: cache.marketRelevance };
            }
          }

          if (s.templateId === "JobDetailSheet" && (s.props?.jobId || s.props?.title) && cache.jobs) {
            const match = lookupJobFromCache(s.props, cache.jobs);
            if (match) {
              const defaults: Record<string, unknown> = {};
              for (const [key, val] of Object.entries(match)) {
                if (val != null && !s.props[key]) defaults[key] = val;
              }
              if (Object.keys(defaults).length > 0) {
                s.props = { ...defaults, ...s.props };
              }
            }
          }

          if (s.templateId === "EligibilitySheet" && (s.props?.jobId || s.props?.jobTitle) && cache.jobs) {
            const match = lookupJobFromCache(buildJobLookupProps(s.props), cache.jobs);
            if (match) {
              if (!s.props.matchScore && match.matchScore != null) s.props = { ...s.props, matchScore: match.matchScore };
              if (!s.props.requiredSkills && match.requiredSkills) s.props = { ...s.props, requiredSkills: match.requiredSkills };
              if (!s.props.recommendedSkills && match.recommendedSkills) s.props = { ...s.props, recommendedSkills: match.recommendedSkills };
              if (!s.props.skillGaps && match.skillGaps) s.props = { ...s.props, skillGaps: match.skillGaps };
              if (!s.props.description && match.description) s.props = { ...s.props, description: match.description };
              if (!s.props.fitCategory && match.fitCategory) s.props = { ...s.props, fitCategory: match.fitCategory };
            }
          }

          if (s.templateId === "CloseGapSheet" && (s.props?.jobId || s.props?.jobTitle) && cache.jobs) {
            const match = lookupJobFromCache(buildJobLookupProps(s.props), cache.jobs);
            if (match) {
              if (!s.props.skillGaps && match.skillGaps) s.props = { ...s.props, skillGaps: match.skillGaps };
              if (!s.props.matchScore && match.matchScore != null) s.props = { ...s.props, matchScore: match.matchScore };
            }
          }

          if (s.templateId === "ProfileSheet" && !s.props?.name) {
            s.props = { ...s.props, name: "Your profile" };
          }
        }

        const hasDashboard = incoming.some((s) => s.templateId === "Dashboard");
        const hasOptions = incoming.some((s) => DASHBOARD_COMPANION_TEMPLATES.has(s.templateId));

        if (hasDashboard && !hasOptions) {
          incoming.push({
            id: "profile-home",
            templateId: "ProfileSheet",
            props: { dashboardAnchor: true },
          });
          const last = incoming[incoming.length - 1];
          if (last.templateId === "ProfileSheet" && TEMPLATES_NEEDING_SKILLS.has(last.templateId)) {
            if (!last.props?.rawSkillProgression && cache.skills) {
              last.props = { ...last.props, rawSkillProgression: cache.skills };
            }
          }
          if (last.templateId === "ProfileSheet" && TEMPLATES_NEEDING_CANDIDATE.has(last.templateId)) {
            if (!cache.candidate) {
              const sess = getVisitorSession();
              if (sess) fetchCandidate(sess.candidateId);
            }
            if (cache.candidate) {
              const cd = unwrapCandidate(cache.candidate);
              if (cd) {
                const candidateName = (cd.name ?? cd.full_name ?? cd.display_name) as string | undefined;
                if (candidateName) last.props = { ...last.props, name: candidateName };
                const candidateTitle = (cd.title as string | undefined) ?? deriveCandidateTitle(cd);
                if (candidateTitle && !last.props?.title) last.props = { ...last.props, title: candidateTitle };
                if (cd.avatarUrl && !last.props?.avatarUrl) last.props = { ...last.props, avatarUrl: cd.avatarUrl as string };
                if (cd.avatar_url && !last.props?.avatarUrl) last.props = { ...last.props, avatarUrl: cd.avatar_url as string };
                if (!last.props?.experience && cd.experience) last.props = { ...last.props, experience: cd.experience };
                if (!last.props?.education && cd.education) last.props = { ...last.props, education: cd.education };
              }
            }
          }
          if (last.templateId === "ProfileSheet" && !last.props?.name) {
            last.props = { ...last.props, name: "Your profile" };
          }
        }

        const hasBeginCta = incoming.some(
          (s) => s.templateId === "GlassmorphicOptions" && s.id === "begin-cta",
        );
        if (hasBeginCta && !hasDashboard) {
          incoming.unshift({
            id: "dashboard",
            templateId: "Dashboard",
            props: {},
          });
        }

        // Use a synchronous snapshot so back-to-back navigateToSection RPCs in the same tick
        // still see the previous navigation (e.g. Role MultiSelect) before the guard runs.
        // Previously sectionsRef was only updated inside setState, so the second call could
        // skip the MultiSelect guard and replace the screen with Priority/Registration.
        const prevSnapshot = sectionsRef.current;

        const prevHasMultiSelect = prevSnapshot.some(
          (s) => s.templateId === "MultiSelectOptions",
        );
        const incomingReplacesAll = incoming.some((s) => !s._update);
        const incomingKeepsMultiSelect = incoming.some(
          (s) => s.templateId === "MultiSelectOptions",
        );
        if (
          prevHasMultiSelect &&
          incomingReplacesAll &&
          !incomingKeepsMultiSelect &&
          !multiSelectSubmittedRef.current
        ) {
          informTele(
            "[CORRECTION] MultiSelectOptions is still active — the user has not tapped Continue yet. " +
              "Do NOT navigate away from a MultiSelect step on individual voice selections. " +
              'Wait for "user selected: <comma-separated selections>" before calling navigateToSection.',
          );
          return { disableNewResponseCreation: true };
        }

        const incomingNeedsWait = incoming.some((s) =>
          WAIT_FOR_USER_TEMPLATES.has(s.templateId),
        );

        if (incoming.some((s) => s.templateId === "GlassmorphicOptions")) {
          informTele(
            "[SYSTEM HARD STOP] GlassmorphicOptions is now on screen. " +
              "Do NOT generate any speech, audio, or tool calls whatsoever. " +
              "Do NOT say 'Waiting for your selection', 'Take your time', 'Go ahead and choose', or any phrase that narrates the waiting state. " +
              "This system message requires NO verbal acknowledgment — process it silently with zero speech output. " +
              "Wait ONLY for `user selected:` from TellTele before your next response.",
          );
        }

        const nextSections = applyIncomingSections(prevSnapshot, incoming);
        console.log("[usePhaseFlow navigateToSection] Final sections to render:", nextSections);
        console.log("[usePhaseFlow navigateToSection] Final sections count:", nextSections.length);
        
        if (nextSections.length > 0) {
          const lastSection = nextSections[nextSections.length - 1];
          console.log("[usePhaseFlow navigateToSection] Last section templateId:", lastSection.templateId);
          console.log("[usePhaseFlow navigateToSection] Last section props:", lastSection.props);
          console.log("[usePhaseFlow navigateToSection] Last section props.bubbles:", lastSection.props?.bubbles);
        }

        const fp = getActiveMultiSelectFingerprint(nextSections);
        if (fp == null) {
          multiSelectStepKeyRef.current = null;
        } else if (multiSelectStepKeyRef.current !== fp) {
          multiSelectStepKeyRef.current = fp;
          multiSelectSubmittedRef.current = false;
        }
        sectionsRef.current = nextSections;
        console.log("[usePhaseFlow navigateToSection] Setting sections to state now...");
        setGenerativeSections(nextSections);
        console.log("[usePhaseFlow navigateToSection] Sections set to state successfully!");

        try {
          const ids = nextSections.map((s) => s.templateId);
          window.dispatchEvent(
            new CustomEvent("tele-navigate-section", { detail: { templateIds: ids } })
          );
        } catch {}

        return incomingNeedsWait || shouldDisableNewResponse(nextSections)
          ? { disableNewResponseCreation: true }
          : true;
      } catch {
        const now = Date.now();
        if (now - lastParseNudgeAtRef.current > 1200) {
          lastParseNudgeAtRef.current = now;
          informTele(
            "[CORRECTION NEEDED] navigateToSection payload was invalid JSON. " +
              "Retry immediately with valid JSON (double quotes, no trailing commas, closed strings, closed braces). " +
              "Include root keys badge/title/subtitle/generativeSubsections and valid subsection objects."
          );
        }
      }

      return false;
    },
    []
  );

  useEffect(() => {
    registerSiteFunctions();

    const w = window as unknown as {
      UIFrameworkSiteFunctions?: Record<string, unknown>;
      __siteFunctions?: Record<string, unknown>;
    };

    w.UIFrameworkSiteFunctions ??= {};
    w.UIFrameworkSiteFunctions.navigateToSection = navigateToSection;

    w.__siteFunctions ??= {};
    w.__siteFunctions.navigateToSection = navigateToSection;

    patchSiteFunctions();
  }, [navigateToSection]);

  useEffect(() => {
    const handler = () => {
      multiSelectSubmittedRef.current = true;
    };
    window.addEventListener("multi-select-submitted", handler);
    return () => window.removeEventListener("multi-select-submitted", handler);
  }, []);

  const loadingLinkedInEnteredAtRef = useRef<number | null>(null);

  useEffect(() => {
    const handler = () => {
      loadingLinkedInEnteredAtRef.current = Date.now();
      setGenerativeSections([
        {
          id: "loading-linkedin",
          templateId: "LoadingLinkedIn",
          props: { message: "Connecting with LinkedIn\u2026" },
        },
      ]);
      sectionsRef.current = [
        {
          id: "loading-linkedin",
          templateId: "LoadingLinkedIn",
          props: { message: "Connecting with LinkedIn\u2026" },
        },
      ];
    };
    window.addEventListener("linkedin-continue", handler);
    return () => window.removeEventListener("linkedin-continue", handler);
  }, []);

  const LINKEDIN_TOOLS_MIN_MS = 2500;
  const { speech } = useTeleSpeech();
  const linkedInSuccessNudgeFiredRef = useRef(false);
  useEffect(() => {
    const active = generativeSubsections[generativeSubsections.length - 1];
    if (active?.templateId !== "LoadingLinkedIn") {
      linkedInSuccessNudgeFiredRef.current = false;
      loadingLinkedInEnteredAtRef.current = null;
      return;
    }
    let enteredAt = loadingLinkedInEnteredAtRef.current;
    if (enteredAt == null) {
      loadingLinkedInEnteredAtRef.current = Date.now();
      enteredAt = loadingLinkedInEnteredAtRef.current;
    }
    const elapsed = Date.now() - enteredAt;
    if (elapsed < LINKEDIN_TOOLS_MIN_MS) return;

    const text = (speech ?? "").toLowerCase();
    const hasSuccessPhrase =
      text.includes("connected successfully") ||
      text.includes("has been connected") ||
      text.includes("profile is linked") ||
      text.includes("connection is complete") ||
      text.includes("successfully connected") ||
      text.includes("connection was successful");
    if (!hasSuccessPhrase || linkedInSuccessNudgeFiredRef.current) return;

    linkedInSuccessNudgeFiredRef.current = true;
    const timer = setTimeout(() => {
      teleAcknowledge(
        "[CORRECTION] You said the connection was successful. Call navigateToSection with CandidateSheet NOW. Do NOT speak again. Just call the tool.",
      );
    }, 500);
    return () => clearTimeout(timer);
  }, [generativeSubsections, speech]);

  useEffect(() => {
    const onThinkingStart = (event: Event) => {
      const detail = (event as CustomEvent<{ skipNavigateDrift?: boolean }>).detail;
      if (detail?.skipNavigateDrift) return;

      if (driftTimerRef.current) clearTimeout(driftTimerRef.current);
      const stampBefore = lastNavigateAtRef.current;
      driftTimerRef.current = setTimeout(() => {
        if (lastNavigateAtRef.current === stampBefore) {
          teleAcknowledge(
            "[SYSTEM CORRECTION] You spoke but FORGOT to call navigateToSection. " +
              "Trigger ONLY the missing part: call navigateToSection NOW with the payload for this step. " +
              "Do NOT speak again. Do NOT list or read options. Do NOT repeat what you already said. Just call the tool.",
          );
        }
      }, NAVIGATE_DRIFT_TIMEOUT_MS);
    };

    window.addEventListener("teleThinkingStart", onThinkingStart);
    return () => {
      window.removeEventListener("teleThinkingStart", onThinkingStart);
      if (driftTimerRef.current) clearTimeout(driftTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const onPopJobBrowse = () => {
      setGenerativeSections((prev) => {
        const next = sliceToJobBrowseAnchor(prev);
        if (next.length === prev.length) return prev;
        sectionsRef.current = next;
        return next;
      });
    };
    window.addEventListener(EVENT_NAVIGATE_POP_JOB_BROWSE, onPopJobBrowse);
    return () => window.removeEventListener(EVENT_NAVIGATE_POP_JOB_BROWSE, onPopJobBrowse);
  }, []);

  const wasConnectedRef = useRef(false);
  useEffect(() => {
    const onConnectionChange = (e: Event) => {
      const connected = (e as CustomEvent<{ connected: boolean }>).detail.connected;
      if (!connected && wasConnectedRef.current) {
        setGenerativeSections(INITIAL_SECTIONS);
        sectionsRef.current = INITIAL_SECTIONS;
      }
      wasConnectedRef.current = connected;
    };
    window.addEventListener("tele-connection-changed", onConnectionChange);
    return () =>
      window.removeEventListener("tele-connection-changed", onConnectionChange);
  }, []);

  const returningVisitorNotifiedRef = useRef(false);
  useEffect(() => {
    if (returningVisitorNotifiedRef.current) return;
    const session = getVisitorSession();
    if (!session) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    (async () => {
      await syncLearningState(session.candidateId);

      fetchCandidate(session.candidateId);
      // Skills / market / career: not auto-fetched via client /api/invoke — agent + prompts supply data.

      timer = setTimeout(() => {
        if (returningVisitorNotifiedRef.current) return;
        returningVisitorNotifiedRef.current = true;
        informTele(
          `[SYSTEM] Returning visitor detected. candidate_id: ${session.candidateId}. ` +
            "Candidate data has been pre-loaded by the frontend. " +
            'Say "Here\'s your profile." and call navigateToSection with EXACTLY this JSON: ' +
            '{"badge":"trAIn CAREER","title":"Dashboard","subtitle":"Your Profile",' +
            '"generativeSubsections":[{"id":"dashboard","templateId":"Dashboard","props":{}},' +
            '{"id":"profile-home","templateId":"ProfileSheet","props":{"dashboardAnchor":true}}]}. ' +
            "Do NOT call get_candidate, get_jobs_by_skills, get_skill_progression, get_market_relevance, or get_career_growth now — they are deferred. " +
            "Skip qualification and registration.",
        );
      }, 6000);
    })();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  return { generativeSubsections };
}
