'use client';
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Brain, Cloud, Blocks, Zap, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CircularGauge } from "@/components/charts/CircularGauge";
import type { BubbleOption } from "@/components/FloatingAnswerBubbles";
import { sendSelectionIntent } from "@/utils/teleIntent";
import { informTele } from "@/utils/teleUtils";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useVoiceActions } from "@/hooks/useVoiceActions";
import { useMcpCache } from "@/contexts/McpCacheContext";
import { extractGaugeScores } from "@/utils/computeProfileMetrics";
import { useVoiceTranscriptIntent } from "@/hooks/useVoiceTranscriptIntent";
import { useSpeechFallbackNudge } from "@/hooks/useSpeechFallbackNudge";
import { normalizeVoiceText } from "@/utils/voiceMatch";
import {
  navigateClientToDashboardLanding,
  navigateClientToMarketRelevanceSheet,
} from "@/utils/clientDashboardNavigate";
import { cn } from "@/platform/utils";

interface MarketRelevanceDetailProps {
  rawMarketRelevance?: Record<string, unknown>;
  bubbles?: unknown;
  _triggerWidget?: number;
}

interface InvestmentOpp {
  skill_area: string;
  roi: string;
  reason: string;
}

const ROI_STYLES: Record<string, { badge: string; text: string; iconBg: string }> = {
  "Very High": { badge: "var(--roi-very-high-bg)", text: "var(--roi-very-high)", iconBg: "var(--roi-very-high-icon)" },
  High: { badge: "var(--roi-high-bg)", text: "var(--roi-high)", iconBg: "var(--roi-high-icon)" },
};
const DEFAULT_ROI = ROI_STYLES["High"];

const SKILL_ICON_MAP: Record<string, typeof Brain> = {
  ai: Brain,
  machine: Brain,
  ml: Brain,
  cloud: Cloud,
  system: Blocks,
  design: Blocks,
};

function pickIcon(skillArea: string) {
  const lower = skillArea.toLowerCase();
  for (const [key, Icon] of Object.entries(SKILL_ICON_MAP)) {
    if (lower.includes(key)) return Icon;
  }
  return Zap;
}

function unwrap(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  return (obj.data ?? obj.result ?? obj) as Record<string, unknown>;
}

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

/** Figma 8213:13147 — top fade */
function WidgetGradientBg({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-[rgba(10,10,10,0)] from-[8%] to-[#0a0a0a] to-[64%] ${className}`}
      aria-hidden
    />
  );
}

/**
 * Two-widget flow with bubble-based navigation (Figma 8213:13144–13196):
 * Widget 1 — gauge + insight + 2 bubble options (View Market Relevance / Where to Invest)
 * Widget 2 — "Where to Invest Your Time" investment opportunities list
 */
export function MarketRelevanceDetail({ rawMarketRelevance, bubbles: bubblesRaw, _triggerWidget }: MarketRelevanceDetailProps) {
  const cache = useMcpCache();
  const resolved = rawMarketRelevance ?? (cache.marketRelevance as Record<string, unknown> | null) ?? undefined;
  const data = useMemo(() => unwrap(resolved), [resolved]);

  const gaugeScores = useMemo(() => extractGaugeScores(cache.skills), [cache.skills]);
  const score = gaugeScores.marketRelevance ?? (data?.overall_score as number) ?? 0;
  const insight = data?.key_insight as { headline?: string; body?: string } | undefined;
  const investments = (data?.investment_opportunities as InvestmentOpp[]) ?? [];

  const [activeWidget, setActiveWidget] = useState<1 | 2>(1);
  const bubbleOptions = useMemo(() => normalizeBubbles(bubblesRaw), [bubblesRaw]);
  const emptyBubblesNudgedRef = useRef(false);

  useEffect(() => {
    if (bubbleOptions.length === 0) {
      if (!emptyBubblesNudgedRef.current) {
        emptyBubblesNudgedRef.current = true;
        informTele(
          "[CORRECTION NEEDED] MarketRelevanceDetail requires non-empty `bubbles` in props (same shape as GlassmorphicOptions). " +
            'Expected: [{"label":"View Market Relevance","variant":"green","showArrow":true},{"label":"Where to Invest Your Time","variant":"default"}]',
        );
      }
      return;
    }
  }, [bubbleOptions]);

  useVoiceActions(
    useMemo(
      () => [
        {
          phrases: ["close", "go back", "back to profile", "dashboard"],
          action: () => navigateClientToDashboardLanding(),
        },
      ],
      [],
    ),
  );

  const handleClose = () => navigateClientToDashboardLanding();

  const handleBubbleSelect = useCallback((option: BubbleOption) => {
    const label = option.value ?? option.label;
    const normalizedLabel = label.toLowerCase();

    if (normalizedLabel.includes("view market relevance") || normalizedLabel.includes("market relevance")) {
      void navigateClientToMarketRelevanceSheet();
      void sendSelectionIntent(label, undefined, { skipNavigateDrift: true });
      return;
    }

    if (normalizedLabel.includes("invest") || normalizedLabel.includes("where to invest")) {
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

      // First check bubbleOptions from widget 1
      for (const opt of bubbleOptions) {
        const optNorm = normalizeVoiceText(opt.label);
        if (normalized.includes(optNorm) || optNorm.includes(normalized)) {
          match = opt;
          break;
        }
      }

      // If on widget 2, also check for "View Market Relevance"
      if (!match && activeWidget === 2) {
        if (normalized.includes("view market relevance") || normalized.includes("market relevance")) {
          match = { label: "View Market Relevance", variant: "green", showArrow: true };
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
      ? ["market", "relevance", "tips"]
      : ["invest", "time", "recommend"],
    matchMode: "any",
    instruction:
      activeWidget === 1
        ? `[SYSTEM] MarketRelevanceDetail Widget 1 is visible with ${bubbleOptions.length} bubble options. ` +
          `Speak: "Your current market relevance is ${score >= 75 ? "excellent" : score >= 60 ? "good" : score >= 40 ? "fair" : "needs improvement"} at ${score}%. Here's some tips on how to bring it up." ` +
          "Then wait for user to select a bubble option."
        : `[SYSTEM] MarketRelevanceDetail Widget 2 is visible showing investment opportunities. ` +
          "Speak: \"Here's where I recommend investing your time.\" " +
          "Then wait for user to select 'View Market Relevance'.",
    delayMs: 1500,
  });

  // Handle agent-triggered widget changes via _triggerWidget prop
  useEffect(() => {
    if (_triggerWidget !== undefined && _triggerWidget !== activeWidget) {
      if (_triggerWidget === 1 || _triggerWidget === 2) {
        setActiveWidget(_triggerWidget);
      }
    }
  }, [_triggerWidget, activeWidget]);

  const displayInvestments =
    investments.length > 0
      ? investments
      : [
          { skill_area: "Kubernetes", roi: "Very High", reason: "42% demand surge — largest gap in your profile" },
          { skill_area: "ML Frameworks", roi: "High", reason: "Stable demand, strong salary uplift, moderate gap" },
          { skill_area: "System Design", roi: "High", reason: "Key for senior roles — differentiator at your level" },
        ];

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
        <div
          data-testid="market-relevance-detail"
          className="relative z-20 flex min-h-[280px] flex-col gap-4 overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {activeWidget === 1 ? (
              <motion.div
                key="widget-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="relative flex flex-col gap-4"
              >
                <WidgetGradientBg />

                {/* Gauge + insight */}
                <motion.div
                  key="w1-gauge"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="relative z-[1] mt-1 flex gap-4 rounded-2xl p-4 glass-surface"
                >
                  <CircularGauge percentage={score} size={98} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-5 text-[var(--text-secondary)]">
                      {insight?.body ? (
                        renderInsightBody(insight.body)
                      ) : (
                        <>
                          Your strongest skills (<span className="font-semibold">Python, SQL</span>) remain in high
                          demand, but the fastest-growing area (<span className="font-semibold">AI/ML</span>) is your
                          biggest gap. Investing in ML fundamentals could move you into the top{" "}
                          <span className="font-bold">15%</span>.
                        </>
                      )}
                    </p>
                  </div>
                </motion.div>

                {/* Bubble Options */}
                {bubbleOptions.length > 0 && (
                  <motion.div
                    key="w1-bubbles"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="relative z-[1] flex flex-wrap gap-3 justify-center pb-1"
                  >
                    {bubbleOptions.map((option) => (
                      <BubblePill key={option.label} option={option} onSelect={handleBubbleSelect} />
                    ))}
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="widget-2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col gap-4"
              >
                <div className="rounded-2xl p-4 flex flex-col gap-4 glass-surface">
                  <p className="text-[var(--text-primary)] text-xl font-semibold leading-6">
                    Where to Invest Your Time
                  </p>
                  <div className="flex flex-col gap-4">
                    {displayInvestments.map((opp, i) => (
                      <motion.div
                        key={`${opp.skill_area}-${i}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <InvestmentRow opp={opp} />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Widget 2 bubble - View Market Relevance */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="relative z-[1] flex justify-center"
                >
                  <BubblePill
                    option={{ label: "View Market Relevance", variant: "green", showArrow: true }}
                    onSelect={() => {
                      void navigateClientToMarketRelevanceSheet();
                      void sendSelectionIntent("View Market Relevance", undefined, { skipNavigateDrift: true });
                    }}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </BottomSheet>
    </>
  );
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
        "relative px-4 py-3 rounded-full flex items-center justify-center gap-2 max-w-[min(100%,14rem)] sm:max-w-none break-words text-center",
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

function InvestmentRow({ opp }: { opp: InvestmentOpp }) {
  const colors = ROI_STYLES[opp.roi] ?? DEFAULT_ROI;
  const Icon = pickIcon(opp.skill_area);

  return (
    <div className="flex gap-4 items-center">
      <div
        className="size-8 rounded-[10px] flex items-center justify-center shrink-0"
        style={{ backgroundColor: colors.iconBg }}
      >
        <Icon size={16} style={{ color: colors.text }} />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[var(--text-primary)] text-[13px] font-semibold leading-5">
            {opp.skill_area}
          </span>
          <span
            className="text-[11px] font-semibold leading-4 px-2 py-0.5 rounded-full shrink-0"
            style={{ backgroundColor: colors.badge, color: colors.text }}
          >
            ROI: {opp.roi}
          </span>
        </div>
        <p className="text-[var(--text-dim)] text-[11px] leading-4">{opp.reason}</p>
      </div>
    </div>
  );
}

function renderInsightBody(body: string) {
  const match = body.match(/(top\s+\d+%)/i);
  if (!match) return body;

  const idx = body.indexOf(match[1]);
  const before = body.slice(0, idx);
  const bold = match[1];
  const after = body.slice(idx + bold.length);

  return (
    <>
      {before}
      <span className="font-bold">{bold}</span>
      {after}
    </>
  );
}
