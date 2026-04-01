'use client';
import { useState, useEffect, useMemo, useCallback, useRef } from "react";

import { Bookmark, X } from "lucide-react";
import { SAVED_JOBS_MOCK } from "@/mocks/savedJobsData";
import { JobListCard } from "@/components/ui/JobListCard";
import { BaseSheetLayout } from "@/components/ui/BaseSheetLayout";
import { categorizeFit, getFitInfo, type FitCategory } from "@/utils/categorizeFit";
import { mockJobs } from "@/mocks/jobSearchData";
import { notifyTele, informTele } from "@/utils/teleUtils";
import { useSpeechFallbackNudge } from "@/hooks/useSpeechFallbackNudge";
import { useVoiceActions } from "@/hooks/useVoiceActions";
import type { JobListing } from "@/types/flow";
import { cn } from "@/platform/utils";
import { navigateClientToDashboardLanding, setLastBrowseScreen, navigateBackFromJobSearch } from "@/utils/clientDashboardNavigate";

const TABS: { category: FitCategory; label: string }[] = [
  { category: "good-fit", label: "Good fit" },
  { category: "stretch", label: "Stretch" },
  { category: "grow-into", label: "Grow into" },
];

interface JobSearchSheetProps {
  jobs?: JobListing[];
  /** LLM can set the initial tab (e.g. "stretch") so the UI opens on the right category. */
  activeTab?: FitCategory;
  /**
   * When true, opens with the Saved Jobs filter on (shortlist from profile).
   * Omit or `false` for normal browse — e.g. "View all saved jobs" / "Find more jobs" should land on full Job Center without this flag.
   */
  showSavedOnly?: boolean;
}

function ensureCardFields(job: JobListing): Required<Pick<JobListing, "matchScore">> & JobListing {
  return {
    ...job,
    matchScore: job.matchScore ?? 0,
    salaryRange: job.salaryRange ?? "—",
    aiSummary: job.aiSummary ?? "",
  };
}

export function JobSearchSheet({ jobs: propJobs, activeTab: initialTab, showSavedOnly: initialSavedOnly = false }: JobSearchSheetProps) {
  const [activeTab, setActiveTab] = useState<FitCategory>(initialTab ?? "good-fit");
  const [savedOnly, setSavedOnly] = useState(Boolean(initialSavedOnly));
  /** Per-card bookmark state; seed with mock saved ids so demo shortlist matches Profile → Saved Jobs. */
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(() => new Set(SAVED_JOBS_MOCK.map((j) => j.id)));

  useEffect(() => { setLastBrowseScreen("job-search"); }, []);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setSavedOnly(Boolean(initialSavedOnly));
  }, [initialSavedOnly]);

  useSpeechFallbackNudge({
    enabled: true,
    requiredPhrases: ["good fit", "stretch", "grow"],
    matchMode: "any",
    instruction:
      "[SYSTEM] Job Center is visible with three job categories. " +
      "For each category, first describe what it means, then state how many roles are in it. " +
      "Good Fit = roles that closely match the candidate's current skills (apply with confidence). " +
      "Stretch = roles within reach with some upskilling (great for growth). " +
      "Grow Into = aspirational roles for future direction (significant development needed). " +
      "After covering all three with their counts (from context), ask which they'd like to explore.",
    delayMs: 1800,
  });

  const browseJobs = useMemo(() => {
    if (propJobs && propJobs.length > 0) return propJobs.map(ensureCardFields);
    return (mockJobs as unknown as JobListing[]).map(ensureCardFields);
  }, [propJobs]);

  const displayJobs = useMemo(() => {
    if (!savedOnly) return browseJobs;
    return SAVED_JOBS_MOCK.map(ensureCardFields);
  }, [savedOnly, browseJobs]);

  const categorized = useMemo(() => {
    const buckets: Record<FitCategory, JobListing[]> = {
      "good-fit": [],
      stretch: [],
      "grow-into": [],
    };
    for (const job of displayJobs) {
      const cat = job.fitCategory ?? categorizeFit(job.matchScore ?? 0).category;
      buckets[cat].push(job);
    }
    return buckets;
  }, [displayJobs]);

  const insightSentRef = useRef(false);
  useEffect(() => {
    if (insightSentRef.current) return;
    insightSentRef.current = true;
    const gf = categorized["good-fit"].length;
    const st = categorized["stretch"].length;
    const gi = categorized["grow-into"].length;
    informTele(
      "[SYSTEM] Job Center is now visible. Start by giving a brief insight about each category, then mention its count. " +
        `Good Fit (${gf} roles) — these closely match the candidate's current skills and experience; they can apply with confidence. ` +
        `Stretch (${st} roles) — these are within reach but would require some upskilling; great for pushing growth. ` +
        `Grow Into (${gi} roles) — aspirational roles for future career direction; the candidate may need significant development to qualify. ` +
        "After describing all three, ask which category they'd like to explore.",
    );
  }, [categorized]);

  const activeJobs = categorized[activeTab];
  const activeFit = getFitInfo(activeTab);

  const handleJobClick = useCallback((job: JobListing) => {
    void notifyTele(`user selected job: ${job.title} at ${job.company} [jobId:${job.id}]`);
  }, []);

  const toggleJobSaved = useCallback((jobId: string) => {
    setSavedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  }, []);

  const handleEligibleFromList = useCallback((job: JobListing) => {
    void notifyTele(`user clicked: Am I eligible? | jobId:${job.id} | ${job.title} at ${job.company}`);
  }, []);

  const handleClose = useCallback(() => {
    navigateBackFromJobSearch(() => navigateClientToDashboardLanding());
  }, []);

  const switchToGoodFit = useCallback(() => setActiveTab("good-fit"), []);
  const switchToStretch = useCallback(() => setActiveTab("stretch"), []);
  const switchToGrowInto = useCallback(() => setActiveTab("grow-into"), []);

  const jobVoiceActions = useMemo(
    () =>
      displayJobs.map((job) => ({
        phrases: [
          job.title.toLowerCase(),
          `${job.title} at ${job.company}`.toLowerCase(),
          `${job.title} ${job.company}`.toLowerCase(),
        ],
        action: () => handleJobClick(job),
      })),
    [displayJobs, handleJobClick],
  );

  const showSavedList = useCallback(() => setSavedOnly(true), []);
  const showBrowseList = useCallback(() => setSavedOnly(false), []);

  useVoiceActions(
    useMemo(
      () => [
        { phrases: ["close", "dashboard", "go back", "back"], action: handleClose },
        { phrases: ["good fit"], action: switchToGoodFit },
        { phrases: ["stretch"], action: switchToStretch },
        { phrases: ["grow into"], action: switchToGrowInto },
        { phrases: ["saved jobs", "my saved jobs", "show saved", "saved only"], action: showSavedList },
        { phrases: ["all jobs", "browse jobs", "job matches", "show all jobs"], action: showBrowseList },
        ...jobVoiceActions,
      ],
      [
        handleClose,
        switchToGoodFit,
        switchToStretch,
        switchToGrowInto,
        showSavedList,
        showBrowseList,
        jobVoiceActions,
      ],
    ),
  );

  const headerContent = (
    <>
      <div className="relative px-6 pt-8 pb-2">
        <div className="flex items-start justify-between gap-3 mt-10">
          <div className="flex-1 min-w-0">
            <h1 className="text-[var(--text-primary)] text-[32px] font-semibold leading-10">
              Job Center
            </h1>
            <p className="text-[var(--text-dim)] text-sm mt-0.5">Find your next job here</p>
          </div>

          <button
            type="button"
            data-testid="job-center-saved-toggle"
            onClick={() => setSavedOnly((s) => !s)}
            className={cn(
              "shrink-0 flex items-center gap-2 pl-3 pr-2.5 py-2 rounded-full text-sm font-semibold transition-all pointer-events-auto mt-1",
              savedOnly
                ? "bg-[var(--accent)] no-lightboard shadow-[0_4px_4px_rgba(0,0,0,0.25)] text-[var(--accent-contrast)]"
                : [
                    "glass-card top-sheen",
                    "text-[var(--text-secondary)] font-normal",
                    "hover:opacity-90",
                  ],
            )}
          >
            <span className="whitespace-nowrap">Saved Jobs</span>
            <Bookmark
              size={18}
              className="shrink-0"
              strokeWidth={savedOnly ? 2.5 : 2}
              fill={savedOnly ? "currentColor" : "none"}
            />
          </button>
        </div>
      </div>

      
      {/* Tabs — single glass container with inner active pill */}
      <div
        className="mx-6 mt-3 mb-2 flex rounded-2xl p-[5px]"
        style={{
          background: "var(--surface-elevated)",
          border: "1px solid var(--border-soft)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        {TABS.map(({ category, label }) => {
          const isActive = activeTab === category;
          const fit = getFitInfo(category);
          return (
            <button
              key={category}
              data-testid={`job-search-tab-${category}`}
              onClick={() => setActiveTab(category)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: isActive ? fit.bgColor : "transparent",
                border: isActive ? `1px solid ${fit.borderColor}` : "1px solid transparent",
                color: isActive ? fit.color : "var(--text-muted)",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </>
  );

  return (
    <BaseSheetLayout
      testId="job-search-sheet"
      onClose={handleClose}
      animate={false}
      scrollClassName="px-6 pb-8"
      header={headerContent}
    >
      <div className="flex flex-col gap-3">
      {activeJobs.length === 0 && (
            <p className="text-center text-[var(--text-subtle)] text-sm py-12">
              {savedOnly ? "No saved jobs in this category yet." : "No jobs in this category yet."}
            </p>
          )}
        {activeJobs.map((job) => {
            const j = ensureCardFields(job);
            return (
              <JobListCard
                key={j.id}
                id={j.id}
                title={j.title}
                company={j.company}
                companyLogo={j.companyLogo}
                location={j.location}
                salaryRange={j.salaryRange ?? "—"}
                matchScore={j.matchScore ?? 0}
                fitCategory={j.fitCategory ?? categorizeFit(j.matchScore ?? 0).category}
                aiSummary={j.aiSummary ?? ""}
                aiGapInsight={j.aiGapInsight}
                postedAt={j.postedAt ?? ""}
                saved={savedJobIds.has(j.id)}
                onSaveToggle={() => toggleJobSaved(j.id)}
                onViewJob={() => handleJobClick(j)}
                onEligible={() => handleEligibleFromList(j)}
              />
            );
          })}
      </div>

      <div className="mt-6 text-center">
        <p className="text-[var(--text-dim)] text-xs">
        {savedOnly
              ? `Showing your saved shortlist — ${activeFit.label} roles`
              : `Showing ${activeJobs.length} ${activeFit.label.toLowerCase()} jobs based on your skills`}
        </p>
      </div>
    </BaseSheetLayout>
  );
}
