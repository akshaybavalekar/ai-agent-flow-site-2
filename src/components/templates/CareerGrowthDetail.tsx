'use client';
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CircularGauge } from "@/components/charts/CircularGauge";
import { BarChart, type BarChartItem } from "@/components/charts/BarChart";
import type { BubbleOption } from "@/components/FloatingAnswerBubbles";
import { sendSelectionIntent } from "@/utils/teleIntent";
import { informTele } from "@/utils/teleUtils";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useVoiceActions } from "@/hooks/useVoiceActions";
import { useVoiceTranscriptIntent } from "@/hooks/useVoiceTranscriptIntent";
import { useSpeechFallbackNudge } from "@/hooks/useSpeechFallbackNudge";
import { normalizeVoiceText } from "@/utils/voiceMatch";
import { useMcpCache } from "@/contexts/McpCacheContext";
import { extractGaugeScores } from "@/utils/computeProfileMetrics";
import {
  navigateClientToDashboardLanding,
  navigateClientToCareerGrowthSheet,
} from "@/utils/clientDashboardNavigate";

interface CareerGrowthDetailProps {
  rawCareerGrowth?: Record<string, unknown>;
  bubbles?: unknown;
  _triggerWidget?: number;
}

function unwrap(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  return (obj.data ?? obj.result ?? obj) as Record<string, unknown>;
}

const DEFAULT_BARS: BarChartItem[] = [
  { label: "1 yr ago", value: "16K", height: 40, color: "var(--comp-bar-past)" },
  { label: "Current", value: "22K", height: 60, color: "var(--funnel-bar-blue)" },
  { label: "6-mo proj.", value: "28K", height: 75, color: "var(--comp-bar-projected)" },
  { label: "Target", value: "35K", height: 100, color: "var(--comp-bar-target)" },
];

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

function WidgetGradientBg({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute left-0 right-0 top-0 h-[72px] bg-gradient-to-b from-[#09090b]/100 via-[#09090b]/56 to-transparent pointer-events-none ${className}`}
    />
  );
}

export function CareerGrowthDetail({ rawCareerGrowth, bubbles, _triggerWidget }: CareerGrowthDetailProps) {
  const cache = useMcpCache();
  const resolved = rawCareerGrowth ?? (cache.careerGrowth as Record<string, unknown> | null) ?? undefined;
  const data = useMemo(() => unwrap(resolved), [resolved]);

  const compTraj = (data?.compensation_trajectory as Record<string, unknown>) ?? {};
  const careerGrowthFallback = (compTraj.market_percentile as number) ?? 68;

  const gaugeScores = useMemo(() => extractGaugeScores(cache.skills), [cache.skills]);
  const summary = (data?.summary as Record<string, number>) ?? {};
  const appToInterviewRate = summary.app_to_interview_rate ?? 34;
  const compensationRatio = summary.compensation_ratio ?? 18;
  const marketPercentile = summary.market_percentile ?? 68;
  const yoyGrowth = summary.yoy_growth ?? compensationRatio;

  const compTrajectory = useMemo<BarChartItem[]>(() => {
    const comp = data?.compensation_trajectory as Record<string, unknown> | undefined;
    const snapshots = comp?.snapshots as Record<string, unknown>[] | undefined;
    if (!snapshots?.length) return DEFAULT_BARS;
    const maxVal = Math.max(...snapshots.map((s) => Number(s.amount_sar) || 0), 1);
    const colors = [
      "var(--comp-bar-past)",
      "var(--funnel-bar-blue)",
      "var(--comp-bar-projected)",
      "var(--comp-bar-target)",
    ];
    return snapshots.map((s, i) => ({
      label: String(s.label ?? ""),
      value: `${Number(s.amount_sar) || 0}K`,
      height: (Number(s.amount_sar) / maxVal) * 100,
      color: colors[i] ?? "var(--funnel-bar-blue)",
    }));
  }, [data]);

  const bars = compTrajectory.length >= 2 ? compTrajectory : DEFAULT_BARS;

  const bubbleOptions = useMemo(() => normalizeBubbles(bubbles), [bubbles]);
  const [activeWidget, setActiveWidget] = useState(1);

  const emptyBubblesNudgedRef = useRef(false);

  useEffect(() => {
    if (bubbleOptions.length === 0) {
      if (!emptyBubblesNudgedRef.current) {
        emptyBubblesNudgedRef.current = true;
        informTele(
          "[CORRECTION NEEDED] CareerGrowthDetail requires non-empty `bubbles` in props (same shape as GlassmorphicOptions). " +
            'Expected: [{"label":"View Career Growth","variant":"green","showArrow":true},{"label":"Compensation Trajectory","variant":"default"}]',
        );
      }
      return;
    }
  }, [bubbleOptions]);

  useVoiceActions(
    useMemo(() => [
      { phrases: ["close", "go back", "back to profile", "dashboard"], action: () => navigateClientToDashboardLanding() },
    ], []),
  );

  const handleClose = () => navigateClientToDashboardLanding();

  const handleBubbleSelect = useCallback((option: BubbleOption) => {
    const label = option.value ?? option.label;
    const normalizedLabel = label.toLowerCase();

    if (normalizedLabel.includes("view career growth") || normalizedLabel.includes("career growth")) {
      void navigateClientToCareerGrowthSheet();
      void sendSelectionIntent(label, undefined, { skipNavigateDrift: true });
      return;
    }

    if (normalizedLabel.includes("compensation") || normalizedLabel.includes("trajectory")) {
      setActiveWidget(2);
      void sendSelectionIntent(label, undefined, { skipNavigateDrift: true });
      return;
    }
  }, []);

  const lastVoiceIntentRef = useRef<{ key: string; at: number } | null>(null);
  const VOICE_INTENT_DEDUPE_MS = 2000;

  const onVoiceBubbleTranscript = useCallback(
    (transcript: string) => {
      const normalized = normalizeVoiceText(transcript);
      let match: BubbleOption | null = null;

      for (const opt of bubbleOptions) {
        const optNorm = normalizeVoiceText(opt.label);
        if (normalized.includes(optNorm) || optNorm.includes(normalized)) {
          match = opt;
          break;
        }
      }

      if (!match && activeWidget === 2) {
        if (normalized.includes("view career growth") || normalized.includes("career growth")) {
          match = { label: "View Career Growth", variant: "green", showArrow: true };
        }
      }

      if (!match) return;
      const key = match.label;
      const now = Date.now();
      if (lastVoiceIntentRef.current?.key === key && now - lastVoiceIntentRef.current.at < VOICE_INTENT_DEDUPE_MS) {
        return;
      }
      lastVoiceIntentRef.current = { key, at: now };
      handleBubbleSelect(match);
    },
    [bubbleOptions, handleBubbleSelect, activeWidget],
  );

  useVoiceTranscriptIntent({ onTranscript: onVoiceBubbleTranscript });

  useSpeechFallbackNudge({
    enabled: bubbleOptions.length > 0 || activeWidget === 2,
    requiredPhrases: activeWidget === 1 
      ? ["career", "growth", "accelerating", "helping"]
      : ["compensation", "growing", "percentile", "growth"],
    matchMode: "any",
    instruction:
      activeWidget === 1
        ? `[SYSTEM] CareerGrowthDetail Widget 1 is visible with ${bubbleOptions.length} bubble options. ` +
          "Speak: \"Your career growth is accelerating steadily. Here's how this is helping you.\" " +
          "Then wait for user to select a bubble option."
        : `[SYSTEM] CareerGrowthDetail Widget 2 is visible showing compensation trajectory. ` +
          `Speak: "Your compensation is growing steadily. You're in the ${marketPercentile}th percentile with ${yoyGrowth}% year-over-year growth." ` +
          "Then wait for user to select 'View Career Growth'.",
    delayMs: 1500,
  });

  useEffect(() => {
    if (_triggerWidget !== undefined && _triggerWidget !== activeWidget) {
      if (_triggerWidget === 1 || _triggerWidget === 2) {
        setActiveWidget(_triggerWidget);
      }
    }
  }, [_triggerWidget, activeWidget]);

  return (
    <>
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-10 size-10 rounded-full flex items-center justify-center bg-[var(--surface-elevated)] pointer-events-auto"
        aria-label="Close"
      >
        <X size={20} className="text-[var(--text-primary)]" />
      </button>
      <BottomSheet onClose={handleClose}>
        <AnimatePresence mode="wait">
          {activeWidget === 1 ? (
            <motion.div
              key="widget1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              data-testid="career-growth-detail-widget-1"
              className="relative overflow-hidden flex flex-col gap-4 z-20"
            >
              <WidgetGradientBg />

              {/* Top metrics card: gauge + stats */}
              <div className="rounded-2xl p-4 flex gap-4 items-center glass-surface">
                <CircularGauge percentage={gaugeScores.careerGrowth ?? careerGrowthFallback} size={94} />
                <div className="flex-1 min-w-0 flex flex-wrap gap-2">
                  <div className="flex-1 min-w-[90px] flex flex-col gap-1 rounded-2xl">
                    <span className="text-[var(--text-primary)] text-xs leading-4">App → Interview</span>
                    <span className="text-[var(--text-primary)] text-xl font-semibold leading-[30px]">{appToInterviewRate}%</span>
                    <div className="flex items-center gap-1">
                      <ArrowUpRight size={12} className="text-[var(--accent)]" />
                      <span className="text-[var(--accent)] text-xs leading-4">+8% vs avg</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-[90px] flex flex-col gap-1 rounded-2xl">
                    <span className="text-[var(--text-primary)] text-xs leading-4">Compensation rate</span>
                    <span className="text-[var(--text-primary)] text-xl font-semibold leading-[30px]">+{compensationRatio}%</span>
                    <div className="flex items-center gap-1">
                      <ArrowUpRight size={12} className="text-[var(--accent)]" />
                      <span className="text-[var(--accent)] text-xs leading-4">vs 1 yr ago</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bubbles */}
              {bubbleOptions.length > 0 && (
                <div className="flex gap-2 items-center flex-wrap">
                  {bubbleOptions.map((opt, i) => (
                    <BubblePill key={i} option={opt} onClick={() => handleBubbleSelect(opt)} />
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="widget2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              data-testid="career-growth-detail-widget-2"
              className="relative overflow-hidden flex flex-col gap-4 z-20"
            >
              <WidgetGradientBg />

              {/* Compensation Trajectory */}
              <div className="rounded-2xl p-4 flex flex-col gap-4 glass-surface">
                <p className="text-[var(--text-primary)] text-xl font-semibold leading-6">
                  Compensation Trajectory
                </p>

                <BarChart bars={bars} />

                {/* Bottom stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-[14px] pt-3 px-3 pb-3 flex flex-col gap-0.5 bg-[var(--stat-bg)]">
                    <span className="text-[var(--text-label)] text-[10px] leading-[15px]">Market percentile</span>
                    <span className="text-[var(--text-primary)] text-base font-semibold leading-6">{marketPercentile}th</span>
                  </div>
                  <div className="rounded-[14px] pt-3 px-3 pb-3 flex flex-col gap-0.5 bg-[var(--stat-bg)]">
                    <span className="text-[var(--text-label)] text-[10px] leading-[15px]">YoY growth</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[var(--accent)] text-base font-semibold leading-6">+{yoyGrowth}%</span>
                      <ArrowUpRight size={14} className="text-[var(--accent)]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bubble for widget 2 */}
              <div className="flex gap-2 items-center flex-wrap">
                <BubblePill
                  option={{ label: "View Career Growth", variant: "green", showArrow: true }}
                  onClick={() =>
                    handleBubbleSelect({ label: "View Career Growth", variant: "green", showArrow: true })
                  }
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </BottomSheet>
    </>
  );
}

interface BubblePillProps {
  option: BubbleOption;
  onClick: () => void;
}

function BubblePill({ option, onClick }: BubblePillProps) {
  const isGreen = option.variant === "green";
  const bg = isGreen ? "bg-[var(--accent)]" : "bg-[var(--surface-elevated)]";
  const text = isGreen ? "text-[var(--text-inverse)]" : "text-[var(--text-primary)]";

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex items-center gap-2 rounded-3xl px-4 py-3 ${bg} ${text} text-base font-semibold leading-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]`}
    >
      {option.label}
      {option.showArrow && <span className="text-lg">→</span>}
    </motion.button>
  );
}
