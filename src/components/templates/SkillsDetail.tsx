'use client';
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CircularGauge } from "@/components/charts/CircularGauge";
import { LevelMeter } from "@/components/charts/LevelMeter";
import type { PathStop } from "@/components/charts/PathTrack";
import type { BubbleOption } from "@/components/FloatingAnswerBubbles";
import { sendSelectionIntent } from "@/utils/teleIntent";
import { informTele } from "@/utils/teleUtils";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useVoiceActions } from "@/hooks/useVoiceActions";
import { useVoiceTranscriptIntent } from "@/hooks/useVoiceTranscriptIntent";
import { useSpeechFallbackNudge } from "@/hooks/useSpeechFallbackNudge";
import { normalizeVoiceText } from "@/utils/voiceMatch";
import {
  computeProfileMetrics,
  mapRawSkillProgression,
  type SkillProgressionItem,
} from "@/utils/computeProfileMetrics";
import { DEFAULT_STOPS } from "@/constants/careerPathStops";
import {
  navigateClientToDashboardLanding,
  navigateClientToSkillCoverage,
  navigateClientToSkillTestFlow,
} from "@/utils/clientDashboardNavigate";


/* ── Constants ────────────────────────────────────────────────────────────── */

const HARDCODED_SKILL_GAPS: SkillProgressionItem[] = [
  {
    name: "Kubernetes",
    current_level: 1,
    target_level: 2,
    is_featured: true,
  },
];

/* ── Types ────────────────────────────────────────────────────────────────── */

interface SkillsDetailProps {
  rawSkillProgression?: Record<string, unknown>;
  skillCoverage?: number;
  targetRole?: string;
  bubbles?: unknown;
  _triggerWidget?: number;
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

function WidgetGradientBg({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute left-0 right-0 top-0 h-[72px] bg-gradient-to-b from-[#09090b]/100 via-[#09090b]/56 to-transparent pointer-events-none ${className}`}
    />
  );
}

export function SkillsDetail({
  rawSkillProgression,
  skillCoverage: overrideCoverage,
  targetRole: overrideRole,
  bubbles,
  _triggerWidget,
}: SkillsDetailProps) {
  const skillData = useMemo(
    () => mapRawSkillProgression(rawSkillProgression),
    [rawSkillProgression],
  );
  const computed = useMemo(() => computeProfileMetrics(skillData), [skillData]);

  const coverage = overrideCoverage ?? computed.skillCoverage ?? 73;
  const targetRole = overrideRole ?? computed.targetRole ?? "AI Engineer";

  const stops: PathStop[] = useMemo(() => {
    const last = DEFAULT_STOPS[DEFAULT_STOPS.length - 1];
    if (targetRole && last.label !== targetRole) {
      return [DEFAULT_STOPS[0], DEFAULT_STOPS[1], { label: targetRole, status: "upcoming" }];
    }
    return DEFAULT_STOPS;
  }, [targetRole]);

  useSpeechFallbackNudge({
    enabled: false,
    requiredPhrases: ["skill", "coverage"],
    matchMode: "any",
    instruction:
      `[SYSTEM] SkillsDetail is now visible. Say: "You are working towards ${targetRole}. You are ${coverage}% of the way there. I recommend working on your Kubernetes skills."`,
    delayMs: 1200,
  });
  const bubbleOptions = useMemo(() => normalizeBubbles(bubbles), [bubbles]);
  const [activeWidget, setActiveWidget] = useState(1);

  const emptyBubblesNudgedRef = useRef(false);

  useEffect(() => {
    if (bubbleOptions.length === 0) {
      if (!emptyBubblesNudgedRef.current) {
        emptyBubblesNudgedRef.current = true;
        informTele(
          "[CORRECTION NEEDED] SkillsDetail requires non-empty `bubbles` in props (same shape as GlassmorphicOptions). " +
            'Expected: [{"label":"View Skill Coverage","variant":"green","showArrow":true},{"label":"Recommend a Skill","variant":"default"}]',
        );
      }
      return;
    }
  }, [bubbleOptions]);

  useVoiceActions(
    useMemo(() => [
      { phrases: ["close", "go back", "back to profile", "dashboard"], action: () => navigateClientToDashboardLanding() },
      { phrases: ["kubernetes", "start kubernetes", "learning path", "upgrade kubernetes"], action: () => navigateClientToSkillTestFlow() },
    ], []),
  );

  const handleClose = () => navigateClientToDashboardLanding();

  const handleBubbleSelect = useCallback((option: BubbleOption) => {
    const label = option.value ?? option.label;
    const normalizedLabel = label.toLowerCase();

    if (normalizedLabel.includes("view skill coverage") || normalizedLabel.includes("skill coverage")) {
      void navigateClientToSkillCoverage();
      void sendSelectionIntent(label, undefined, { skipNavigateDrift: true });
      return;
    }

    if (normalizedLabel.includes("recommend") || normalizedLabel.includes("recommend a skill")) {
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
        if (normalized.includes("view skill coverage") || normalized.includes("skill coverage")) {
          match = { label: "View Skill Coverage", variant: "green", showArrow: true };
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
      ? ["working", "towards", "recommend", "kubernetes"]
      : ["recommend", "focus"],
    matchMode: "any",
    instruction:
      activeWidget === 1
        ? `[SYSTEM] SkillsDetail Widget 1 is visible with ${bubbleOptions.length} bubble options. ` +
          `Speak: "You are working towards ${targetRole}. You are ${Math.round(coverage)}% of the way there. I recommend working on your Kubernetes skills." ` +
          "Then wait for user to select a bubble option."
        : `[SYSTEM] SkillsDetail Widget 2 is visible showing skill recommendations. ` +
          "Speak: \"Here's what I recommend you focus on.\" " +
          "Then wait for user to select 'View Skill Coverage' or click Kubernetes.",
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
              data-testid="skills-detail-widget-1"
              className="relative overflow-hidden flex flex-col gap-4 z-20"
            >
              <WidgetGradientBg />

              {/* Widget 1: Gauge + Career Path (side-by-side, compact) */}
              <div className="rounded-2xl p-4 flex gap-4 items-center glass-surface">
                <CircularGauge percentage={coverage} size={105} />
                <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-hidden pb-16">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-primary)] text-xl font-semibold">Career Path</span>
                  </div>
                  <div className="relative">
                    {/* Progress bar */}
                    <div className="h-[5px] w-full bg-white/25 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#a5e8bc] via-[#69d88f] to-[#1dc558] rounded-full"
                        style={{ width: `${(coverage / DEFAULT_STOPS.length) * 100}%` }}
                      />
                    </div>
                    {/* Path stops */}
                    <div className="absolute -top-[5px] left-0 right-0 flex justify-between">
                      {stops.map((stop, idx) => {
                        const isComplete = idx === 0;
                        const isCurrent = idx === 1;
                        const isUpcoming = idx > 1;
                        return (
                          <div key={stop.label} className="flex flex-col items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded-full border-2 ${
                                isComplete
                                  ? "bg-[#a5e8bc] border-[#a5e8bc]"
                                  : isCurrent
                                    ? "bg-[#69d88f] border-[#69d88f]"
                                    : "bg-white border-white"
                              }`}
                            />
                            <span className="text-[var(--text-primary)] text-xs text-center leading-4 max-w-[60px]">
                              {stop.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bubbles */}
              {bubbleOptions.length > 0 && (
                <div className="flex gap-2 items-center flex-wrap">
                  {bubbleOptions.map((opt, i) => (
                    <BubblePill key={i} option={opt} onSelect={handleBubbleSelect} />
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
              data-testid="skills-detail-widget-2"
              className="relative overflow-hidden flex flex-col gap-4 z-20"
            >
              <WidgetGradientBg />

              {/* We recommend section */}
              <div className="rounded-2xl p-4 flex flex-col gap-4 glass-surface">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-[var(--accent)]" />
                  <span className="text-[var(--text-primary)] text-xl font-semibold">We recommend</span>
                </div>

                {HARDCODED_SKILL_GAPS.map((skill) => {
                  const levelLabels = ["Novice", "Beginner", "Intermediate", "Advanced", "Expert"];
                  const currentLabel = levelLabels[skill.current_level] || "Novice";
                  const targetLabel = levelLabels[skill.target_level] || "Expert";

                  return (
                    <button
                      key={skill.name}
                      onClick={() => navigateClientToSkillTestFlow()}
                      className="flex flex-col gap-2 w-full text-left pointer-events-auto"
                    >
                      <p className="text-[var(--text-primary)] text-base font-bold">
                        {skill.name}
                      </p>

                      <LevelMeter current={skill.current_level} target={skill.target_level} height={6} gap={2} />

                      <span className="text-sm text-[var(--text-primary)]">
                        {skill.current_level === 0 ? "Missing Skill" : `${currentLabel} → ${targetLabel}`}
                      </span>

                      <p className="text-[var(--text-primary)] text-base leading-6">
                        <span className="font-bold">{skill.name}</span>
                        {" "}appears as part of your Target Role and in{" "}
                        <span className="font-bold">3 of your saved jobs</span>.
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Bubble for widget 2 */}
              <div className="flex gap-2 items-center flex-wrap">
                <BubblePill
                  option={{ label: "View Skill Coverage", variant: "green", showArrow: true }}
                  onSelect={() => {
                    void navigateClientToSkillCoverage();
                    void sendSelectionIntent("View Skill Coverage", undefined, { skipNavigateDrift: true });
                  }}
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
  onSelect: (o: BubbleOption) => void;
}

function BubblePill({ option, onSelect }: BubblePillProps) {
  const isGreen = option.variant === "green";
  const bg = isGreen ? "bg-[var(--accent)]" : "bg-[var(--surface-elevated)]";
  const text = isGreen ? "text-[var(--text-inverse)]" : "text-[var(--text-primary)]";

  return (
    <motion.button
      onClick={() => onSelect(option)}
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
