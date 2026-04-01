'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { CardStack } from "@/components/ui/CardStack";
import type { BubbleOption } from "@/components/FloatingAnswerBubbles";
import type { JobListing } from "@/types/flow";
import { SAVED_JOBS_MOCK } from "@/mocks/savedJobsData";
import { informTele } from "@/utils/teleUtils";
import { sendInvalidOptionVoiceIntent, sendSelectionIntent } from "@/utils/teleIntent";
import { useBrowserSpeech } from "@/hooks/useBrowserSpeech";
import { useSpeechFallbackNudge } from "@/hooks/useSpeechFallbackNudge";
import { useVoiceTranscriptIntent } from "@/hooks/useVoiceTranscriptIntent";
import { normalizeVoiceText, resolveVoiceMatchForSavedJobsBubbles } from "@/utils/voiceMatch";
import { setLastBrowseScreen, navigateClientToJobSearchSheet } from "@/utils/clientDashboardNavigate";
import { cn } from "@/platform/utils";

/** Same contract as GlassmorphicOptions — labels come from `search_knowledge` / journey payloads, not hardcoded in the app. */
function normalizeBubbles(raw: unknown): BubbleOption[] {
  if (!Array.isArray(raw)) return [];
  const out: BubbleOption[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const label = typeof o.label === "string" ? o.label.trim() : "";
    if (!label) continue;
    const opt: BubbleOption = { label };
    if (typeof o.value === "string" && o.value.trim()) opt.value = o.value.trim();
    if (o.variant === "green" || o.variant === "default") opt.variant = o.variant;
    if (o.showArrow === true) opt.showArrow = true;
    out.push(opt);
  }
  return out;
}

interface SavedJobsStackProps {
  /** Optional override; defaults to three frontend-mocked saved jobs. */
  jobs?: JobListing[];
  /** Required — from `search_knowledge` SavedJobsStack payload (same shape as GlassmorphicOptions `bubbles`). */
  bubbles?: unknown;
}

function BubblePill({
  option,
  onSelect,
}: {
  option: BubbleOption;
  onSelect: (o: BubbleOption) => void;
}) {
  const isGreen = option.variant === "green";
  const showArrow = Boolean(isGreen && option.showArrow);
  return (
    <button
      type="button"
      data-testid={`bubble-option-${(option.value ?? option.label).toLowerCase().replace(/\s+/g, "-")}`}
      onClick={() => onSelect(option)}
      className={cn(
        "relative px-4 py-3 rounded-full flex items-center justify-center gap-2 whitespace-nowrap max-w-[min(100%,11rem)] sm:max-w-none",
        "text-sm sm:text-base leading-5 select-none touch-manipulation",
        "transition-transform duration-150 ease-out will-change-transform",
        "active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-deep)]",
        isGreen
          ? "bg-[var(--accent)] no-lightboard shadow-[0_4px_4px_rgba(0,0,0,0.25)] text-[var(--accent-contrast)] font-semibold"
          : [
              "glass-card top-sheen border border-white/12",
              "text-[var(--text-primary)] font-normal",
              "hover:opacity-95",
            ],
      )}
    >
      <span className="relative z-10 text-center">{option.label}</span>
      {showArrow && <ArrowRight size={16} className="relative z-10 shrink-0 text-[var(--accent-contrast)]" />}
    </button>
  );
}

/**
 * Profile → Saved Jobs: stacked job cards (reuse CardStack + GlassmorphicJobCard) +
 * quick-action rows **below** the cards (same styling as floating bubbles).
 */
export function SavedJobsStack({ jobs: jobsProp, bubbles: bubblesRaw }: SavedJobsStackProps) {
  const resolvedJobs = useMemo(
    () => (jobsProp && jobsProp.length > 0 ? jobsProp : SAVED_JOBS_MOCK),
    [jobsProp],
  );
  const bubbleOptions = useMemo(() => normalizeBubbles(bubblesRaw), [bubblesRaw]);

  /** Match navigateToSection bubble label so card tap ≡ "View full posting" bubble. */
  const viewFullPostingLabel = useMemo(() => {
    const opt = bubbleOptions.find(
      (o) =>
        /full\s+posting/i.test(o.label) ||
        (typeof o.value === "string" && /full\s+posting/i.test(o.value)),
    );
    return opt ? (opt.value ?? opt.label).trim() : "View full posting";
  }, [bubbleOptions]);

  const jobListKey = useMemo(() => resolvedJobs.map((j) => j.id).join(","), [resolvedJobs]);

  /** Always matches the top card in CardStack (updates on swipe). Do not reset from jobs[0] on re-render — that broke post-swipe. */
  const [frontJob, setFrontJob] = useState<JobListing | null>(resolvedJobs[0] ?? null);

  const onFrontJobChange = useCallback((j: JobListing | null) => {
    setFrontJob(j);
  }, []);

  useEffect(() => { setLastBrowseScreen("saved-jobs"); }, []);

  const emptyBubblesNudgedRef = useRef(false);
  const hintSentRef = useRef(false);
  useEffect(() => {
    if (bubbleOptions.length === 0) {
      if (!emptyBubblesNudgedRef.current) {
        emptyBubblesNudgedRef.current = true;
        informTele(
          "[CORRECTION NEEDED] SavedJobsStack requires non-empty `bubbles` in props (same shape as GlassmorphicOptions). " +
            "Call search_knowledge with query **SavedJobsStack payload** and call navigateToSection again with `bubbles` from the result.",
        );
      }
      return;
    }
    if (hintSentRef.current) return;
    hintSentRef.current = true;
    const topJob = resolvedJobs[0] ?? null;
    const topJobDesc = topJob
      ? `Top saved job: "${topJob.title}" at ${topJob.company}` +
        (topJob.fitCategory ? ` (${topJob.fitCategory} match)` : "") +
        ". "
      : "";
    informTele(
      `[SYSTEM] SavedJobsStack: ${resolvedJobs.length} saved job(s) visible as a swipeable card stack. ` +
        topJobDesc +
        "Quick-action bubbles are visible. " +
        "Open by acknowledging the saved jobs count, highlighting what makes the top card relevant to their profile, " +
        "briefly explaining the available actions (view full posting, check eligibility, browse more), " +
        "then asking what they'd like to do. " +
        "Wait for `user selected:` before navigating — match the label the user tapped or spoke. " +
        "TellTele for detail/eligibility bubbles includes `| jobId:<id> | <title> at <company>` — use that jobId in navigateToSection; do not ask which job. " +
        "Tapping the front card sends the same `user selected:` as the View full posting bubble for that card.",
    );
  }, [bubbleOptions]);

  const handleBubbleSelect = useCallback((option: BubbleOption) => {
    const label = option.value ?? option.label;
    const normalizedLabel = label.toLowerCase();

    // Browse labels: navigate client-side with the correct showSavedOnly flag so the
    // agent cannot open JobSearchSheet with the wrong state.
    if (/find.*more.*jobs|more.*jobs|browse.*jobs/i.test(normalizedLabel)) {
      navigateClientToJobSearchSheet(false);
      void sendSelectionIntent(label, undefined, { skipNavigateDrift: true });
      return;
    }
    if (/view.*all.*saved|all.*saved.*jobs/i.test(normalizedLabel)) {
      navigateClientToJobSearchSheet(true);
      void sendSelectionIntent(label, undefined, { skipNavigateDrift: true });
      return;
    }

    /** Top card from CardStack, or first saved job if state has not synced yet (voice should still carry jobId). */
    const jobForIntent = frontJob ?? resolvedJobs[0] ?? null;
    /** Same pattern as JobSearchSheet `user selected job: … [jobId:…]` — agent must get jobId in TellTele, not only the bubble label. */
    void sendSelectionIntent(
      label,
      jobForIntent
        ? { jobId: jobForIntent.id, title: jobForIntent.title, company: jobForIntent.company }
        : undefined,
    );
  }, [frontJob, resolvedJobs]);

  const handleJobCardTap = useCallback(
    (job: JobListing) => {
      void sendSelectionIntent(viewFullPostingLabel, {
        jobId: job.id,
        title: job.title,
        company: job.company,
      });
    },
    [viewFullPostingLabel],
  );

  const topJob = resolvedJobs[0] ?? null;
  useSpeechFallbackNudge({
    enabled: bubbleOptions.length > 0,
    requiredPhrases: ["saved", "jobs"],
    matchMode: "any",
    instruction:
      `[SYSTEM] SavedJobsStack is visible with ${resolvedJobs.length} saved job(s). ` +
      (topJob
        ? `The top card is "${topJob.title}" at ${topJob.company}` +
          (topJob.fitCategory ? ` — a ${topJob.fitCategory} match. ` : ". ")
        : "") +
      "Greet the user, describe their saved jobs, highlight what makes the top role relevant, " +
      "then explain the available actions (view full posting, check eligibility, browse more jobs) and ask what they'd like to do.",
    delayMs: 2000,
  });

  /** Same dual path as RegistrationForm: Web Speech fires locally; Realtime may attach late — both must behave like a bubble tap. */
  const lastVoiceIntentRef = useRef<{ key: string; at: number } | null>(null);
  const VOICE_INTENT_DEDUPE_MS = 2000;

  // Accordion voice commands (expand/toggle/collapse + section name) belong to overlaid
  // sheets (e.g. EligibilitySheet). Silently ignore them here so we don't fire
  // sendInvalidOptionVoiceIntent and cause the AI to respond with a wrong message.
  const ACCORDION_CMD_RE =
    /^(?:expand|toggle|open|collapse|close)\s+(?:skills?|skill\s+alignment|experience|relevant\s+experience|certifications?)/;

  const onVoiceBubbleTranscript = useCallback(
    (transcript: string) => {
      const norm = normalizeVoiceText(transcript);
      if (ACCORDION_CMD_RE.test(norm)) return;

      const match = resolveVoiceMatchForSavedJobsBubbles(transcript, bubbleOptions);
      const key = match
        ? (match.value ?? match.label)
        : `__invalid__:${norm}`;
      const now = Date.now();
      const last = lastVoiceIntentRef.current;
      if (last && last.key === key && now - last.at < VOICE_INTENT_DEDUPE_MS) return;
      lastVoiceIntentRef.current = { key, at: now };

      if (match) handleBubbleSelect(match);
      else void sendInvalidOptionVoiceIntent();
    },
    [bubbleOptions, handleBubbleSelect],
  );

  useVoiceTranscriptIntent({
    enabled: bubbleOptions.length > 0,
    onTranscript: onVoiceBubbleTranscript,
  });

  useBrowserSpeech({
    enabled: bubbleOptions.length > 0,
    onTranscript: onVoiceBubbleTranscript,
  });

  const bubbleRows = useMemo(() => {
    const rows: BubbleOption[][] = [];
    for (let i = 0; i < bubbleOptions.length; i += 2) {
      rows.push(bubbleOptions.slice(i, i + 2));
    }
    return rows;
  }, [bubbleOptions]);

  return (
    <div data-testid="saved-jobs-stack" className="absolute inset-0 flex flex-col pointer-events-none">
      <div
        className="absolute inset-0 z-0 bg-[var(--bg-deep)]/88 no-lightboard pointer-events-none"
        aria-hidden
      />

      <div
        className="relative z-10 flex flex-col flex-1 min-h-0 px-4 pt-[calc(5.25rem+env(safe-area-inset-top,0px))] pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))]"
      >
        

        <div className="flex-1 flex flex-col justify-end min-h-0 gap-3 pointer-events-none">
          <div className="shrink-0 flex justify-center pointer-events-auto">
            <div className="w-full max-w-[min(100%,400px)] overflow-visible">
              <CardStack
                key={jobListKey}
                jobs={resolvedJobs}
                onFrontJobChange={onFrontJobChange}
                onJobSelected={handleJobCardTap}
                openJobPreviewOnTap={false}
                voiceActionsEnabled={false}
                companyAvatar="initials"
              />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="shrink-0 flex flex-col gap-2 pointer-events-auto w-full max-w-lg ml-auto"
          >
            {bubbleRows.map((row, ri) => (
              <div key={`saved-jobs-bubble-row-${ri}`} className="flex flex-wrap gap-2 justify-end">
                {row.map((opt, bi) => (
                  <BubblePill
                    key={`${ri}-${bi}-${opt.value ?? opt.label}`}
                    option={opt}
                    onSelect={handleBubbleSelect}
                  />
                ))}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
