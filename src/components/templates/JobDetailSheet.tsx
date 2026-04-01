'use client';
import { useMemo, useState, useEffect, useRef } from "react";
import {

  ArrowRight,
  MapPin,

  Play,
  Sparkles,
  RefreshCw,
  Loader2,
  BookOpen,
  AlertCircle,
  Bookmark,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { informTele, notifyTele, popJobBrowseScreen } from "@/utils/teleUtils";
import { navigateBackToBrowseScreen } from "@/utils/clientDashboardNavigate";
import { useSpeechFallbackNudge } from "@/hooks/useSpeechFallbackNudge";
import { useVoiceActions } from "@/hooks/useVoiceActions";
import { categorizeFit, type FitCategory } from "@/utils/categorizeFit";
import { FitScoreBadge } from "@/components/ui/FitScoreBadge";
import { useMcpCache } from "@/contexts/McpCacheContext";
import { resolveJobsArray } from "@/platform/mcpBridge";
import { getSavedJobById } from "@/mocks/savedJobsData";
import type { BackendSkillGap } from "@/types/flow";
import { LearningPathTemplate } from "@/components/templates/LearningPathTemplate";

interface JobDetailSheetProps {
  jobId?: string;
  title?: string;
  company?: string;
  companyLogo?: string;
  location?: string;
  salaryRange?: string;
  salaryMin?: number;
  salaryMax?: number;
  description?: string;
  matchScore?: number;
  fitCategory?: FitCategory;
  aiSummary?: string;
  aiGapInsight?: string;
  postedAt?: string;
  fullPostingSummary?: string;
  candidateId?: string;
  /** When provided, the back button calls this instead of notifying Tele (for local embedding). */
  onClose?: () => void;
}

const SalaryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
    <path
      d="M12 3v18M16.5 6.5H9.75a3 3 0 0 0 0 6h4.5a3 3 0 0 1 0 6H7"
      stroke="var(--text-muted)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function fmtSalary(min?: number, max?: number): string | undefined {
  if (min == null || max == null) return undefined;
  const fmt = (v: number) => v.toLocaleString("en-US");
  return `${fmt(min)} – ${fmt(max)}`;
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

function lookupFromCache(
  jobId: string | undefined,
  title: string | undefined,
  company: string | undefined,
  jobs: unknown,
): Record<string, unknown> | null {
  const arr = resolveJobsArray(jobs);
  const tLower = title?.toLowerCase();
  const cLower = company?.toLowerCase();

  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const inner =
      rec.job && typeof rec.job === "object"
        ? (rec.job as Record<string, unknown>)
        : rec;
    const id = (inner.job_id ?? inner.id ?? inner.jobId) as string | undefined;
    if (jobId && id === jobId) return inner;
    const iTitle = (inner.title as string | undefined)?.toLowerCase();
    const iCompany = ((inner.company_name ?? inner.company) as string | undefined)?.toLowerCase();
    if (tLower && iTitle === tLower && (!cLower || iCompany === cLower)) return inner;
  }
  return null;
}

export function JobDetailSheet(props: JobDetailSheetProps) {
  const cache = useMcpCache();
  const [showLearningPath, setShowLearningPath] = useState(false);

  /** Saved-jobs path: starts saved; browse path: starts unsaved. */
  const savedMock = useMemo(() => getSavedJobById(props.jobId), [props.jobId]);
  const [isSaved, setIsSaved] = useState(() => !!getSavedJobById(props.jobId));

  const cached = useMemo(() => {
    if (props.description || props.location || props.salaryRange || props.salaryMin) return null;
    if (!cache.jobs) return null;
    return lookupFromCache(props.jobId, props.title, props.company, cache.jobs);
  }, [props.jobId, props.title, props.company, props.description, props.location, props.salaryRange, props.salaryMin, cache.jobs]);

  /** Profile → Saved Jobs uses mock ids (saved-1, …) not present in MCP job cache — merge local mock like cache hit. */

  const title =
    props.title ??
    (cached?.title as string | undefined) ??
    savedMock?.title ??
    "Job";
  const company =
    props.company ??
    (cached?.company_name as string | undefined) ??
    (cached?.company as string | undefined) ??
    savedMock?.company ??
    "";
  const location = props.location ?? (cached?.location as string | undefined) ?? savedMock?.location;
  const salaryRange =
    props.salaryRange ??
    fmtSalary(props.salaryMin, props.salaryMax) ??
    fmtSalary(cached?.salary_min as number | undefined, cached?.salary_max as number | undefined) ??
    savedMock?.salaryRange;
  const description = props.description ?? (cached?.description as string | undefined) ?? savedMock?.description;
  const companyLogo =
    props.companyLogo ??
    (cached?.company_logo as string | undefined) ??
    savedMock?.companyLogo;
  const postingSummary =
    props.fullPostingSummary ?? savedMock?.fullPostingSummary ?? description;
  const matchScore =
    props.matchScore ??
    (cached?.match_score as number | undefined) ??
    (cached?.score as number | undefined) ??
    savedMock?.matchScore;
  const fitCategory =
    props.fitCategory ??
    savedMock?.fitCategory ??
    (matchScore != null ? categorizeFit(matchScore).category : undefined);
  const aiSummary = props.aiSummary ?? (cached?.ai_summary as string | undefined) ?? savedMock?.aiSummary;

  const rawSkillGaps = cached?.skill_gaps as BackendSkillGap[] | undefined;
  const jobId = props.jobId ?? (cached?.id as string | undefined);
  const isLearningPathJob = jobId === "job_004" && rawSkillGaps && rawSkillGaps.length > 0;

  const hasData = !!(description || salaryRange || location);
  /** Saved-job mocks supply body without waiting for fetchJobs; do not spin forever when cache.jobs is empty. */
  const isLoading = !hasData && !cache.jobs && !savedMock;

  const isGoodFit = fitCategory === "good-fit";
  const insightPrefix = isGoodFit ? "Strong fit." : "Close match.";

  const jobInsightSentRef = useRef(false);
  useEffect(() => {
    if (!hasData || jobInsightSentRef.current) return;
    jobInsightSentRef.current = true;
    const fitLabel = fitCategory
      ? { "good-fit": "Good Fit", "stretch": "Stretch", "grow-into": "Grow Into" }[fitCategory] ?? fitCategory
      : null;
    const parts: string[] = [
      `[SYSTEM] JobDetailSheet is now visible for "${title}" at ${company}.`,
    ];
    if (matchScore != null) parts.push(`Match score: ${matchScore}%${fitLabel ? ` (${fitLabel})` : ""}.`);
    if (salaryRange) parts.push(`Salary: ${salaryRange}.`);
    if (location) parts.push(`Location: ${location}.`);
    if (aiSummary) parts.push(`Role summary: ${aiSummary}`);
    parts.push(
      "Give the user specific insights: what makes this role a strong or partial match for their background, " +
      "highlight any standout details (salary, location, fit tier), mention any skill gaps if known. " +
      "Then invite them to check their eligibility or take an action. Keep it to 2–3 sentences.",
    );
    informTele(parts.join(" "));
  }, [hasData, title, company, matchScore, fitCategory, salaryRange, location, aiSummary]);

  useSpeechFallbackNudge({
    enabled: hasData,
    requiredPhrases: [title.toLowerCase()],
    matchMode: "any",
    instruction:
      `[SYSTEM] JobDetailSheet is visible for "${title}" at ${company}. ` +
      (matchScore != null ? `Match score: ${matchScore}%. ` : "") +
      (salaryRange ? `Salary: ${salaryRange}. ` : "") +
      "Describe what makes this role a good match (or a stretch) for the candidate, highlight 1–2 standout details, " +
      "then ask if they'd like to check their eligibility or take an action.",
    delayMs: 1400,
  });

  const handleBack = () => {
    if (props.onClose) {
      props.onClose();
      return;
    }
    navigateBackToBrowseScreen(() => {
      popJobBrowseScreen();
      void informTele("[SYSTEM] User closed JobDetailSheet; UI restored to the previous browse screen. Do not call navigateToSection.");
    });
    void informTele(
      savedMock
        ? "[SYSTEM] User closed JobDetailSheet from Saved Jobs; UI restored to SavedJobsStack. Do not call navigateToSection."
        : "[SYSTEM] User closed JobDetailSheet from Job Center; UI restored to JobSearchSheet. Do not call navigateToSection.",
    );
  };

  const handleRetry = () => {
    void notifyTele("user clicked: retry job detail");
  };

  const handleEligibility = () => {
    if (jobId) {
      void notifyTele(`user clicked: Am I eligible? | jobId:${jobId} | ${title} at ${company}`);
    } else {
    void notifyTele("user clicked: Am I eligible?");
    }
  };

  const handleSave = () => {
    const next = !isSaved;
    setIsSaved(next);
    void notifyTele(
      savedMock
        ? next ? "user clicked: Save Job" : "user clicked: Unsave Job"
        : "user clicked: Save for later",
    );
  };

  useVoiceActions(
    useMemo(() => [
      { phrases: ["go back", "back"], action: handleBack },
      { phrases: ["save", "save for later", "save job"], action: handleSave },
      { phrases: ["eligibility", "am I eligible", "eligible"], action: handleEligibility },
      { phrases: ["retry", "try again"], action: handleRetry },
    ], [jobId, title, company, savedMock]),
  );

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-[110] flex flex-col bg-[var(--bg-deep)] no-lightboard"
      style={{ isolation: "isolate" }}
      data-testid="job-detail-sheet"
    >
      {hasData ? (
        <>
          {/* Top-right close button — same as saved-jobs path */}
          <button
            type="button"
            data-testid="job-detail-sheet-close-btn"
            aria-label="Close"
            onClick={handleBack}
            className="fixed top-[calc(1rem+env(safe-area-inset-top,0px))] right-4 z-[100] size-10 rounded-full flex items-center justify-center bg-[var(--surface-elevated)] pointer-events-auto border border-[var(--border-soft)]"
          >
            <X size={20} className="text-[var(--text-primary)]" />
          </button>

          <div className="flex-1 overflow-y-auto px-5 pb-6 pt-[calc(4.25rem+env(safe-area-inset-top,0px))]">
            <div
              className="rounded-[28px] p-5 flex flex-col gap-5 border border-white/[0.08]"
              style={{ background: "#1C1C1E", boxShadow: "0 16px 48px rgba(0,0,0,0.45)" }}
            >
              {/* Header: initials + title + fit score */}
              <div className="flex gap-3 items-start">
                <CompanyLogoMark src={companyLogo} company={company} />
                <div className="flex-1 min-w-0 pt-0.5">
                  <h2 className="text-[var(--text-primary)] text-[22px] font-bold leading-[1.2] tracking-tight">
                    {title}
                  </h2>
                  <p className="text-[var(--text-muted)] text-[15px] mt-1.5">{company}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0 pt-0.5">
                  <span className="text-[var(--text-muted)] text-[11px] font-medium leading-none">Fit Score</span>
                  {matchScore != null && fitCategory && (
                    <FitScoreBadge score={Math.round(matchScore)} category={fitCategory} size={50} />
                  )}
                  {matchScore != null && !fitCategory && (
                    <FitScoreBadge score={Math.round(matchScore)} size={50} />
                  )}
                </div>
              </div>

              {/* Salary + location */}
              <div className="flex items-center gap-5 flex-wrap gap-y-2">
                {salaryRange && (
                  <div className="flex items-center gap-1.5">
                    <SalaryIcon />
                    <span className="text-[var(--text-secondary)] text-sm tabular-nums">
                      {salaryRange.trim().startsWith("$") ? salaryRange : `$ ${salaryRange}`}
                    </span>
                  </div>
                )}
                {location && (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin size={18} className="text-[var(--text-muted)] shrink-0" />
                    <span className="text-[var(--text-secondary)] text-sm">{location}</span>
                  </div>
                )}
              </div>

              {/* Summary */}
              {(postingSummary ?? description) && (
                <div data-testid="job-detail-sheet-description" className="flex flex-col gap-2.5">
                  <p className="text-[var(--text-primary)] text-base font-bold">Summary</p>
                  <p className="text-[var(--text-muted)] text-[15px] leading-[1.55]">{postingSummary ?? description}</p>
                </div>
              )}

              {/* A Day in the life */}
              <div className="flex flex-col gap-3">
                <p className="text-[var(--text-primary)] text-base font-bold">A Day in the life</p>
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black">
                  <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px opacity-95">
                    <div className="bg-gradient-to-br from-slate-600/90 to-slate-900/95" />
                    <div className="bg-gradient-to-br from-slate-700/90 to-slate-900/95" />
                    <div className="bg-gradient-to-br from-slate-700/90 to-slate-900/95" />
                    <div className="bg-gradient-to-br from-slate-600/90 to-slate-900/95" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/75" />
                  {savedMock?.dayInLifeVideoEpisode && (
                    <p className="absolute top-3 left-3 text-[10px] font-semibold tracking-[0.12em] text-white/95 uppercase">
                      {savedMock.dayInLifeVideoEpisode}
                    </p>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-lg">
                      <Play size={22} className="text-white ml-1" fill="white" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 px-3.5 py-3 bg-gradient-to-t from-black via-black/85 to-transparent pt-12">
                    <p className="text-[12px] sm:text-[13px] text-white/95 leading-snug pr-16">
                      {savedMock?.dayInLifeVideoTitle ?? "Recruiters share what every candidate should know"}
                    </p>
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 text-xs font-medium text-white/90 tabular-nums">
                    {savedMock?.dayInLifeVideoDuration ?? "20:08"}
                  </div>
                </div>
              </div>

              {/* AI Insight callout */}
              {aiSummary && (
                <div
                  className="flex items-start gap-3 rounded-2xl p-4"
                  style={{
                    background: isGoodFit
                      ? "linear-gradient(180deg, rgba(22, 101, 52, 0.35) 0%, rgba(15, 60, 30, 0.55) 100%)"
                      : "linear-gradient(180deg, color-mix(in srgb, var(--fit-stretch) 18%, transparent) 0%, color-mix(in srgb, var(--fit-stretch) 8%, transparent) 100%)",
                    border: isGoodFit
                      ? "1px solid color-mix(in srgb, var(--accent) 45%, transparent)"
                      : "1px solid color-mix(in srgb, var(--fit-stretch) 35%, transparent)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                  }}
                >
                  <Sparkles
                    size={18}
                    className="shrink-0 mt-0.5"
                    style={{ color: isGoodFit ? "var(--accent)" : "var(--fit-stretch)" }}
                  />
                  <p
                    className="text-[14px] leading-[1.45]"
                    style={{ color: isGoodFit ? "var(--fit-good-light)" : "var(--fit-stretch-light)" }}
                  >
                    <span className="font-bold">{insightPrefix}</span> {aiSummary}
                  </p>
                </div>
              )}

              {/* Skill Gaps — only for job_004 when gaps exist */}
              {isLearningPathJob && rawSkillGaps && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-[var(--fit-stretch)] shrink-0" />
                    <p className="text-[var(--text-primary)] text-base font-bold">Skill Gaps</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {rawSkillGaps.map((gap) => (
                      <div
                        key={gap.name}
                        className="flex items-center justify-between rounded-xl px-4 py-3"
                        style={{
                          background: "color-mix(in srgb, var(--fit-stretch) 8%, transparent)",
                          border: "1px solid color-mix(in srgb, var(--fit-stretch) 20%, transparent)",
                        }}
                      >
                        <span className="text-[var(--text-primary)] text-sm font-medium capitalize">
                          {gap.name}
                        </span>
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            background: "color-mix(in srgb, var(--fit-stretch) 15%, transparent)",
                            color: "var(--fit-stretch-light)",
                          }}
                        >
                          {gap.current_level == null
                            ? "Missing"
                            : `${gap.current_level} → ${gap.required_level}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pinned CTAs */}
          <div className="px-5 pb-[calc(32px+env(safe-area-inset-bottom,0px))] pt-3 flex flex-col gap-3 bg-[var(--bg-deep)] no-lightboard">
            {isLearningPathJob && (
              <button
                data-testid="job-detail-sheet-learning-btn"
                onClick={() => setShowLearningPath(true)}
                className="w-full h-[52px] flex items-center justify-center gap-2 rounded-full transition-all active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 90%, #8B5CF6), var(--accent))",
                }}
              >
                <BookOpen size={18} className="text-[var(--accent-contrast)]" />
                <span className="text-[var(--accent-contrast)] text-base font-semibold">Start Learning Path</span>
              </button>
            )}
            <div className="flex gap-3">
              <button
                data-testid="job-detail-sheet-save-btn"
                onClick={handleSave}
                className="flex-1 h-[52px] flex items-center justify-center gap-2 rounded-full transition-all active:scale-[0.98] bg-[#2C2C2E] border border-[var(--accent)]"
              >
                <Bookmark
                  size={18}
                  className="text-[var(--accent)]"
                  strokeWidth={2}
                  fill={isSaved ? "var(--accent)" : "none"}
                />
                <span className="text-[var(--accent)] text-base font-semibold">Save Job</span>
              </button>
              <button
                data-testid="job-detail-sheet-eligibility-btn"
                onClick={handleEligibility}
                className="flex-1 h-[52px] bg-[var(--accent)] no-lightboard flex items-center justify-center gap-2 transition-all active:scale-[0.98] rounded-full"
              >
                <span className="text-[var(--accent-contrast)] text-base font-semibold">Am I eligible?</span>
                <ArrowRight size={16} className="text-[var(--accent-contrast)]" />
              </button>
            </div>
          </div>
        </>
      ) : isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-5">
          <Loader2 size={32} className="text-[var(--accent)] animate-spin" />
          <p className="text-[var(--text-muted)] text-sm">Loading job details…</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-5">
          <div className="w-14 h-14 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center">
            <RefreshCw size={24} className="text-[var(--text-muted)]" />
          </div>
          <div className="text-center">
            <p className="text-[var(--text-primary)] text-lg font-semibold mb-1">
              Couldn't load job details
            </p>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed">
              We weren't able to retrieve the details for this position. Please try again.
            </p>
          </div>
          <button
            data-testid="job-detail-sheet-retry-btn"
            onClick={handleRetry}
            className="h-[48px] px-8 bg-[var(--accent)] rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <RefreshCw size={16} className="text-[var(--accent-contrast)]" />
            <span className="text-[var(--accent-contrast)] text-base font-semibold">Try Again</span>
          </button>
        </div>
      )}

      {/* Learning Path overlay — slides in on top of JobDetailSheet */}
      <AnimatePresence>
        {showLearningPath && props.candidateId && (
          <LearningPathTemplate
            candidateId={props.candidateId}
            jobTitle={title}
            onClose={() => setShowLearningPath(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
