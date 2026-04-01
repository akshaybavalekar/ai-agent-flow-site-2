'use client';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, CheckCircle2, ChevronDown, Circle, X } from "lucide-react";
import { FitScoreBadge } from "@/components/ui/FitScoreBadge";
import { informTele, notifyTele, popJobBrowseScreen, teleAcknowledge } from "@/utils/teleUtils";
import { navigateBackToBrowseScreen } from "@/utils/clientDashboardNavigate";
import {
  eligibilityByJob,
  workingOnPlaceholder,
  type CertificationItem,
  type RelevantExperienceItem,
} from "@/mocks/eligibilityData";
import { getSavedJobById, SAVED_JOBS_MOCK } from "@/mocks/savedJobsData";
import { categorizeFit, getFitInfo, type FitCategory } from "@/utils/categorizeFit";
import { deriveSkillMatches } from "@/utils/jobInsights";
import type { SkillMatch, SkillRef, SkillGapRef } from "@/utils/jobInsights";

import { useTeleSpeech } from "@/hooks/useTeleSpeech";
import { useVoiceActions } from "@/hooks/useVoiceActions";

interface EligibilitySheetProps {
  jobId?: string;
  jobTitle?: string;
  company?: string;
  companyLogo?: string;
  matchScore?: number;
  fitCategory?: FitCategory;
  requiredSkills?: SkillRef[];
  recommendedSkills?: SkillRef[];
  skillGaps?: SkillGapRef[];
  skillMatches?: SkillMatch[];
}

function CompanyLogoMark({ src, company }: { src?: string; company: string }) {
  const [failed, setFailed] = useState(false);
  const initials = company.slice(0, 2).toUpperCase();
  if (!src || failed) {
    return (
      <div
        className="w-[52px] h-[52px] shrink-0 rounded-[10px] flex items-center justify-center text-[11px] font-bold text-[var(--text-primary)] border border-white/12"
        style={{ background: "#2C2C2E" }}
      >
        {initials}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      className="w-[52px] h-[52px] shrink-0 rounded-[10px] object-contain bg-white p-1.5 shadow-sm"
      onError={() => setFailed(true)}
    />
  );
}

function proficiencyFor(s: SkillMatch): string {
  if (s.proficiencyLabel) return s.proficiencyLabel;
  if (s.status === "have") return "Intermediate";
  if (s.status === "working-on") return "Beginner";
  return "Beginner";
}

function skillAlignmentSummary(skills: SkillMatch[]): string {
  const total = skills.length;
  const met = skills.filter((s) => s.status !== "missing").length;
  return `${met} of ${total} skills`;
}

interface AccordionRowProps {
  title: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children?: ReactNode;
}

function AccordionRow({ title, summary, open, onToggle, children }: AccordionRowProps) {
  return (
    <div className="rounded-2xl border border-white/[0.12] bg-white/[0.06] backdrop-blur-md overflow-hidden mb-2 last:mb-0 shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-3.5 text-left active:opacity-90"
      >
        <span className="text-[15px] font-semibold text-[var(--text-primary)]">{title}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-medium text-[var(--accent)] tabular-nums">{summary}</span>
          <ChevronDown
            size={18}
            className={`text-[var(--text-muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>
      {open && children && <div className="px-3 pb-3 pt-0 border-t border-white/[0.06]">{children}</div>}
    </div>
  );
}

function SkillRow({ skill }: { skill: SkillMatch }) {
  const warn = skill.iconTone === "warning" || skill.status === "missing";
  const prof = proficiencyFor(skill);
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-white/[0.06] last:border-b-0">
      <div className="flex items-start gap-2.5 min-w-0">
        {warn ? (
          <Circle size={20} className="shrink-0 mt-0.5 text-[var(--fit-stretch)]" strokeWidth={2.2} />
        ) : (
          <CheckCircle2 size={20} className="shrink-0 mt-0.5 text-[var(--accent)]" strokeWidth={2} />
        )}
        <span className="text-[15px] font-medium text-[var(--text-primary)]">{skill.name}</span>
      </div>
      <span
        className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{
          background: warn
            ? "color-mix(in srgb, var(--fit-stretch) 18%, transparent)"
            : "color-mix(in srgb, var(--accent) 18%, transparent)",
          color: warn ? "var(--fit-stretch-light)" : "var(--accent)",
        }}
      >
        {prof}
      </span>
    </div>
  );
}

export function EligibilitySheet({
  jobId,
  jobTitle = "Job",
  company = "Company",
  companyLogo: companyLogoProp,
  matchScore: matchScoreProp,
  fitCategory: fitCategoryProp,
  requiredSkills,
  recommendedSkills,
  skillGaps,
  skillMatches: propSkills,
}: EligibilitySheetProps) {
  const savedJob = useMemo(() => getSavedJobById(jobId), [jobId]);

  const mockData = useMemo(() => {
    if (jobId && eligibilityByJob[jobId]) return eligibilityByJob[jobId];
    const allEntries = Object.values(eligibilityByJob);
    return allEntries[0] ?? null;
  }, [jobId]);

  /**
   * Resolve score: agents often send `matchScore: 0` as a placeholder — treat that as unset and
   * use saved job / eligibility-linked job / demo fallback. Only a positive prop overrides.
   */
  const matchScore = useMemo(() => {
    const fromSaved = savedJob?.matchScore;
    const fromLinked = mockData?.jobId ? getSavedJobById(mockData.jobId)?.matchScore : undefined;
    const fallbackDemo = SAVED_JOBS_MOCK[0]?.matchScore ?? 0;

    const prop =
      typeof matchScoreProp === "number" && Number.isFinite(matchScoreProp) ? matchScoreProp : undefined;

    if (prop !== undefined && prop > 0) return prop;
    if (fromSaved != null) return fromSaved;
    if (fromLinked != null) return fromLinked;
    // Agent placeholder 0 with no saved job — use demo score so the badge isn't empty-looking
    if (prop === 0) return fallbackDemo;
    if (prop !== undefined) return prop;
    return fallbackDemo;
  }, [matchScoreProp, savedJob, mockData?.jobId]);

  const fitCategory = useMemo((): FitCategory => {
    if (fitCategoryProp) return fitCategoryProp;
    if (savedJob?.fitCategory) return savedJob.fitCategory;
    if (mockData?.jobId) {
      const linked = getSavedJobById(mockData.jobId);
      if (linked?.fitCategory) return linked.fitCategory;
    }
    return matchScore > 0 ? categorizeFit(matchScore).category : "good-fit";
  }, [fitCategoryProp, savedJob, mockData?.jobId, matchScore]);

  const companyLogo =
    companyLogoProp ??
    savedJob?.companyLogo ??
    (mockData?.jobId ? getSavedJobById(mockData.jobId)?.companyLogo : undefined);

  const [openSkill, setOpenSkill] = useState(false);
  const [openExp, setOpenExp] = useState(false);
  const [openCert, setOpenCert] = useState(false);
  const sheetScrollRef = useRef<HTMLDivElement>(null);

  const { setSpeechDisplayOverride } = useTeleSpeech();
  const introLineForBubble = useMemo(
    () =>
      `Here's how you stack up for the job. If you apply, ${company} will see this data.`,
    [company],
  );

  useEffect(() => {
    setSpeechDisplayOverride(introLineForBubble);
    return () => setSpeechDisplayOverride(null);
  }, [introLineForBubble, setSpeechDisplayOverride]);

  /** Keep scroll pinned to bottom so accordion expansion grows the card upward, not over the Apply button. */
  useEffect(() => {
    const el = sheetScrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight - el.clientHeight;
    });
  }, [openSkill, openExp, openCert]);

  const hasRealSkillData = !!(requiredSkills?.length || skillGaps?.length);

  const derivedSkills = useMemo(() => {
    if (!hasRealSkillData) return null;
    const derived = deriveSkillMatches(
      requiredSkills ?? [],
      recommendedSkills ?? [],
      skillGaps ?? [],
    );
    const workingOn = derived.filter((s) => s.status === "working-on");
    if (workingOn.length === 0 && workingOnPlaceholder.length > 0) {
      return [...derived, ...workingOnPlaceholder];
    }
    return derived;
  }, [hasRealSkillData, requiredSkills, recommendedSkills, skillGaps]);

  const skillMatches = propSkills ?? derivedSkills ?? mockData?.skillMatches ?? [];
  const relevantExperience: RelevantExperienceItem[] = mockData?.relevantExperience ?? [];
  const certifications: CertificationItem[] = mockData?.certifications ?? [];

  const isGoodFit = fitCategory === "good-fit";
  const fitInfo = getFitInfo(fitCategory);

  useEffect(() => {
    void informTele(
      "[SYSTEM] While EligibilitySheet is visible the following voice inputs are LOCAL UI ACCORDION ACTIONS — " +
        "do NOT explain the section or say it is unavailable. Respond with only 'Sure.' or stay silent: " +
        "'expand/toggle/open skills' or 'expand/toggle/open skill alignment' → opens Skill Alignment. " +
        "'collapse/close skills' or 'collapse/close skill alignment' → closes Skill Alignment. " +
        "'expand/toggle/open experience' or 'expand/toggle/open relevant experience' → opens Relevant Experience. " +
        "'collapse/close experience' or 'collapse/close relevant experience' → closes Relevant Experience. " +
        "'expand/toggle/open certifications' → opens Certifications. " +
        "'collapse/close certifications' → closes Certifications.",
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const eligInsightSentRef = useRef(false);
  useEffect(() => {
    if (eligInsightSentRef.current) return;
    eligInsightSentRef.current = true;

    const metSkills = skillMatches.filter((s) => s.status === "have");
    const gapSkills = skillMatches.filter((s) => s.status === "missing");
    const fitLabel = { "good-fit": "Good Fit", stretch: "Stretch", "grow-into": "Grow Into" }[fitCategory] ?? fitCategory;

    const strengthsStr =
      metSkills.length > 0
        ? `Their top strengths are ${metSkills.slice(0, 3).map((s) => s.name).join(", ")}.`
        : "";
    const gapsStr =
      gapSkills.length > 0
        ? `They still need to close gaps in ${gapSkills.slice(0, 2).map((s) => s.name).join(" and ")}.`
        : "";
    const nextStep =
      fitCategory === "good-fit"
        ? "Recommend they apply now."
        : "Recommend they close the gap first before applying.";

    const instruction =
      `[SYSTEM] Say this eligibility insight aloud now: ` +
      `"You're a ${fitLabel} match for ${jobTitle} at ${company} with a ${matchScore}% fit score. ` +
      `${strengthsStr} ${gapsStr} ${nextStep}"`;

    const t = setTimeout(() => teleAcknowledge(instruction, { visible: false }), 1500);
    return () => clearTimeout(t);
  }, [jobTitle, company, matchScore, fitCategory, skillMatches]);

  const handleApply = useCallback(() => void notifyTele("user clicked: Apply Now"), []);

  const handleCloseGap = useCallback(() => void notifyTele("user clicked: Close the gap"), []);

  const handleClose = useCallback(() => {
    navigateBackToBrowseScreen(() => popJobBrowseScreen());
    void informTele(
      savedJob
        ? "[SYSTEM] User closed EligibilitySheet from Saved Jobs; UI restored to SavedJobsStack. Do not call navigateToSection."
        : "[SYSTEM] User closed EligibilitySheet; UI restored to the previous job browse screen (Job Center or Saved Jobs). Do not call navigateToSection.",
    );
  }, [savedJob]);

  // Tap handlers
  const handleOpenSkills = useCallback(() => setOpenSkill(true), []);
  const handleCloseSkills = useCallback(() => setOpenSkill(false), []);
  const handleOpenExp = useCallback(() => setOpenExp(true), []);
  const handleCloseExp = useCallback(() => setOpenExp(false), []);
  const handleOpenCert = useCallback(() => setOpenCert(true), []);
  const handleCloseCert = useCallback(() => setOpenCert(false), []);

  useEffect(() => {
    const handleAccordionVoice = (e: Event) => {
      const raw = (e as CustomEvent<{ transcript?: string }>).detail?.transcript ?? "";
      const t = raw.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
      if (!t) return;

      const isOpen = /^(?:expand|toggle|open)/.test(t);
      const isClose = /^(?:collapse|close)/.test(t);
      if (!isOpen && !isClose) return;

      if (/skill/.test(t))       { isOpen ? setOpenSkill(true) : setOpenSkill(false); return; }
      if (/experience/.test(t))  { isOpen ? setOpenExp(true)   : setOpenExp(false);   return; }
      if (/certif/.test(t))      { isOpen ? setOpenCert(true)  : setOpenCert(false);  return; }
    };

    window.addEventListener("userTranscriptCompleted", handleAccordionVoice);
    return () => window.removeEventListener("userTranscriptCompleted", handleAccordionVoice);
  }, []);

  useVoiceActions(
    useMemo(
      () => [
        { phrases: ["go back", "back"], action: handleClose },
        { phrases: ["apply now", "apply"], action: handleApply },
        { phrases: ["close the gap", "close gap"], action: handleCloseGap },
      ],
      [handleClose, handleApply, handleCloseGap],
    ),
  );

  const matchRounded = Math.min(Math.max(Math.round(matchScore), 0), 100);

  const expSummary = `${relevantExperience.length} job${relevantExperience.length === 1 ? "" : "s"}`;
  const certSummary = `${certifications.length} certification${certifications.length === 1 ? "" : "s"}`;

  const closeButton = (
    <button
      type="button"
      data-testid="eligibility-sheet-close-btn"
      aria-label="Close"
      onClick={handleClose}
      className="pointer-events-auto size-10 rounded-full flex items-center justify-center bg-[var(--surface-elevated)] border border-[var(--border-soft)] shadow-lg"
      style={{
        position: "fixed",
        top: "calc(1rem + env(safe-area-inset-top, 0px))",
        right: "calc(1rem + env(safe-area-inset-right, 0px))",
        left: "auto",
        zIndex: 130,
      }}
    >
      <X size={20} className="text-[var(--text-primary)]" />
    </button>
  );

  const bottomNavClearance =
    "calc(6.5rem + env(safe-area-inset-bottom, 0px) + var(--vv-bottom-inset, 0px))";

  return (
    <div
      data-testid="eligibility-sheet"
      className="fixed inset-0 z-[110] flex flex-col pointer-events-none no-lightboard"
      style={{ paddingBottom: bottomNavClearance }}
    >
      {typeof document !== "undefined" ? createPortal(closeButton, document.body) : null}

      {/* Fills space above sheet — avatar + speech bubble stay unobstructed */}
      <div className="flex-1 min-h-0 w-full pointer-events-none" aria-hidden />

      {/* pointer-events-none on wrapper: only scroll + card capture touches; bottom padding on root lets nav/mic receive taps */}
      <div className="shrink-0 w-full flex flex-col pointer-events-none bg-transparent overflow-hidden max-h-[min(92vh,100%)]">
        <div
          ref={sheetScrollRef}
          className="pointer-events-auto max-h-[min(52vh,calc(100vh-7rem))] min-h-[168px] overflow-y-auto overflow-x-hidden px-5 pt-2 pb-1 bg-transparent"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="flex flex-col pb-2">
            <div className="max-w-lg mx-auto w-full flex flex-col gap-4">
          <div
            className="rounded-[28px] p-5 border border-white/[0.18] bg-white/[0.07] backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/[0.06]"
          >
            <div className="flex gap-3 items-start mb-1">
              <CompanyLogoMark key={`${companyLogo ?? ""}-${company}`} src={companyLogo} company={company} />
              <div className="flex-1 min-w-0 pt-0.5">
                <h2 className="text-[var(--text-primary)] text-[22px] font-bold leading-tight">{jobTitle}</h2>
                <p className="text-[var(--text-muted)] text-[15px] mt-1">{company}</p>
              </div>
              <div
                className="flex flex-col items-end gap-1.5 shrink-0"
                data-testid="eligibility-fit-score-block"
                aria-label={`Fit score ${matchRounded} out of 100`}
              >
                <span className="text-[13px] font-semibold text-[var(--text-primary)] leading-none tracking-tight">
                  Fit score
                </span>
                <FitScoreBadge score={matchRounded} category={fitCategory} size={58} />
              </div>
            </div>

            <div className="mt-1 flex flex-col gap-0">
              <AccordionRow
                title="Skill Alignment"
                summary={skillAlignmentSummary(skillMatches)}
                open={openSkill}
                onToggle={() => setOpenSkill((o) => !o)}
              >
                <div className="rounded-xl px-2 py-1 bg-black/15 backdrop-blur-sm border border-white/[0.05]">
                  {skillMatches.map((s) => (
                    <SkillRow key={s.name} skill={s} />
                  ))}
                </div>
              </AccordionRow>

              <AccordionRow
                title="Relevant Experience"
                summary={expSummary}
                open={openExp}
                onToggle={() => setOpenExp((o) => !o)}
              >
                {relevantExperience.length === 0 ? (
                  <p className="text-[var(--text-muted)] text-sm pl-1">No experience entries on file yet.</p>
                ) : (
                  <ul className="flex flex-col gap-2 pl-1">
                    {relevantExperience.map((ex, i) => (
                      <li key={`${ex.title}-${i}`} className="text-[14px] text-[var(--text-secondary)]">
                        <span className="font-semibold text-[var(--text-primary)]">{ex.title}</span>
                        <span className="text-[var(--text-muted)]"> · {ex.company}</span>
                        {ex.duration && (
                          <span className="text-[var(--text-subtle)] text-xs"> · {ex.duration}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </AccordionRow>

              <AccordionRow
                title="Certifications"
                summary={certSummary}
                open={openCert}
                onToggle={() => setOpenCert((o) => !o)}
              >
                {certifications.length === 0 ? (
                  <p className="text-[var(--text-muted)] text-sm pl-1">No certifications on file yet.</p>
                ) : (
                  <ul className="flex flex-col gap-2 pl-1">
                    {certifications.map((c, i) => (
                      <li key={`${c.name}-${i}`} className="text-[14px] text-[var(--text-secondary)]">
                        <span className="font-medium text-[var(--text-primary)]">{c.name}</span>
                        {c.issuer && <span className="text-[var(--text-muted)]"> · {c.issuer}</span>}
                        {c.year && <span className="text-[var(--text-subtle)] text-xs"> · {c.year}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </AccordionRow>
            </div>
          </div>
            </div>
          </div>
        </div>

      <div className="shrink-0 px-5 pt-2 pb-3 flex justify-end bg-transparent no-lightboard pointer-events-none">
        {isGoodFit ? (
          <button
            data-testid="eligibility-sheet-apply-btn"
            type="button"
            onClick={handleApply}
            className="pointer-events-auto h-[52px] min-w-[140px] px-8 bg-[var(--accent)] no-lightboard rounded-full flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg"
            style={{ boxShadow: "0 8px 24px color-mix(in srgb, var(--accent) 35%, transparent)" }}
          >
            <span className="text-[var(--accent-contrast)] text-base font-semibold">Apply</span>
            <ArrowRight size={18} className="text-[var(--accent-contrast)]" />
          </button>
        ) : (
          <button
            data-testid="eligibility-sheet-close-gap-btn"
            type="button"
            onClick={handleCloseGap}
            className="pointer-events-auto h-[52px] min-w-[180px] px-6 bg-[var(--accent)] no-lightboard rounded-full flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{ color: "var(--accent-contrast)", borderColor: fitInfo.color }}
          >
            <span className="text-base font-semibold">Close the Gap</span>
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
    </div>
  );
}
