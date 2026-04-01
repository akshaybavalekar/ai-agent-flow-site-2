'use client';
import { useEffect, useMemo, useState } from "react";
import { Crosshair, ArrowRight, Sparkles } from "lucide-react";
import { BaseSheetLayout } from "@/components/ui/BaseSheetLayout";
import { notifyTele } from "@/utils/teleUtils";
import { useSpeechFallbackNudge } from "@/hooks/useSpeechFallbackNudge";
import { useVoiceActions } from "@/hooks/useVoiceActions";
import { useCurrentSection } from "@/contexts/CurrentSectionContext";
import { LevelMeter } from "@/components/charts/LevelMeter";
import {
  computeProfileMetrics,
  mapRawSkillProgression,
} from "@/utils/computeProfileMetrics";
import {
  TARGET_ROLE_SKILLS,
  TARGET_ROLE_DESCRIPTION,
  type TargetRoleSkill,
} from "@/mocks/targetRoleData";
import { SkillTestFlow } from "./SkillTestFlow";
import { navigateClientToDashboardLanding, navigateClientToMyLearning } from "@/utils/clientDashboardNavigate";

/* ── Constants ─────────────────────────────────────────────────────────── */

const LEVEL_LABELS = ["Novice", "Beginner", "Intermediate", "Advanced", "Expert"];

/* ── Types ──────────────────────────────────────────────────────────────── */

interface TargetRoleSheetProps {
  rawSkillProgression?: Record<string, unknown>;
  skillCoverage?: number;
  targetRole?: string;
  candidateId?: string;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function skillsMet(skills: TargetRoleSkill[]): number {
  return skills.filter((s) => s.current_level >= s.target_level).length;
}

/* ── Component ─────────────────────────────────────────────────────────── */

export function TargetRoleSheet({
  rawSkillProgression,
  skillCoverage: overrideCoverage,
  targetRole: overrideRole,
  candidateId,
}: TargetRoleSheetProps) {
  const [showTestFlow, setShowTestFlow] = useState(false);
  const resolvedCandidateId = candidateId || "10000000-0000-0000-0000-000000000001";
  const { setOverrideTemplateId } = useCurrentSection();

  useEffect(() => {
    if (showTestFlow) setOverrideTemplateId("SkillTestFlow");
    else setOverrideTemplateId(undefined);
  }, [showTestFlow, setOverrideTemplateId]);

  const skillData = useMemo(
    () => mapRawSkillProgression(rawSkillProgression),
    [rawSkillProgression],
  );
  const computed = useMemo(() => computeProfileMetrics(skillData), [skillData]);

  const coverage = overrideCoverage ?? computed.skillCoverage ?? 50;
  const targetRole = overrideRole ?? computed.targetRole ?? "Senior AI Developer";
  const description = TARGET_ROLE_DESCRIPTION.replace("{role}", targetRole);
  const met = skillsMet(TARGET_ROLE_SKILLS);
  const total = TARGET_ROLE_SKILLS.length;
  const featured = TARGET_ROLE_SKILLS.find((s) => s.is_featured);

  useSpeechFallbackNudge({
    enabled: !showTestFlow,
    requiredPhrases: ["target role"],
    matchMode: "any",
    instruction: `[SYSTEM] TargetRoleSheet is now visible. Say: "Here's your target role breakdown for ${targetRole}. You've met ${met} of ${total} skills so far."`,
    delayMs: 1200,
  });

  const handleClose = () => {
    navigateClientToDashboardLanding();
  };

  useVoiceActions(
    useMemo(
      () => [
        { phrases: ["close", "go back", "back to profile", "dashboard"], action: handleClose },
        { phrases: ["my learning", "learning", "learning path", "learning dashboard"], action: () => navigateClientToMyLearning() },
      ],
      [],
    ),
  );

  if (showTestFlow) {
    return (
      <SkillTestFlow
        candidateId={resolvedCandidateId}
        onBack={() => setShowTestFlow(false)}
        onClose={handleClose}
      />
    );
  }

  return (
    <BaseSheetLayout
      testId="target-role-sheet"
      onClose={handleClose}
      zClass="z-[60]"
      animate={false}
      scrollClassName="px-4 pb-8"
      header={
        <div className="relative px-4 pt-8 pb-2">
          <h1 className="text-[var(--text-primary)] text-2xl font-semibold leading-7 mt-6">
            My Target Role
          </h1>
        </div>
      }
    >
      <div className="flex flex-col gap-8">
          {/* ── Hero card ──────────────────────────────────────────── */}
          <div className="rounded-2xl p-5 flex flex-col gap-2.5"
            style={{
              background: "var(--funnel-bar-blue-surface)",
              border: "1px solid var(--funnel-bar-blue-border)",
            }}
          >
            <div className="flex items-center gap-1">
              <Crosshair size={14} className="text-[var(--funnel-bar-blue)]" />
              <span className="text-[var(--funnel-bar-blue)] text-xs font-medium">
                Target Role
              </span>
            </div>
            <p className="text-[var(--text-primary)] text-2xl font-semibold leading-7">
              {targetRole}
            </p>
            <p className="text-[var(--text-primary)] text-sm leading-5">
              {description}
            </p>

            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2.5 rounded-full" style={{ background: "var(--bar-track-light)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${coverage}%`, background: "var(--funnel-bar-blue)" }}
                />
              </div>
              <span className="text-[var(--funnel-bar-blue)] text-base leading-6">
                {coverage}%
              </span>
            </div>

            <p className="text-[var(--text-primary)] text-[13px] leading-5">
              {met} of {total} skills at required level
            </p>

            <button
              onClick={() => void notifyTele("user clicked: change target role")}
              className="self-end text-[var(--accent)] text-[13px] font-medium pointer-events-auto"
            >
              Change Target Role →
            </button>
          </div>

          {/* ── We recommend ───────────────────────────────────────── */}
          {featured && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[var(--text-primary)]" />
                <span className="text-[var(--text-primary)] text-xl font-semibold">
                  We recommend
                </span>
              </div>

              <button
                onClick={() => setShowTestFlow(true)}
                className="rounded-2xl p-4 flex flex-col gap-4 w-full text-left pointer-events-auto"
                style={{ background: "var(--surface-elevated)" }}
              >
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-center justify-between">
                    <p className="text-[var(--text-primary)] text-base font-bold">
                      {featured.name}
                    </p>
                    <ArrowRight size={16} className="text-[var(--funnel-bar-blue)]" />
                  </div>
                  <LevelMeter current={featured.current_level} target={featured.target_level} variant="blue" />
                  <span className="text-sm text-[var(--text-primary)]">
                    {featured.current_level === 0
                      ? "Missing Skill"
                      : `${LEVEL_LABELS[featured.current_level] ?? "Novice"} → ${LEVEL_LABELS[featured.target_level] ?? "Expert"}`}
                  </span>
                </div>
                <p className="text-[var(--text-primary)] text-base leading-6">
                  <span className="font-bold">{featured.name}</span>
                  {" "}appears as part of your Target Role and in{" "}
                  <span className="font-bold">3 of your saved jobs</span>.
                </p>
              </button>
            </div>
          )}

          {/* ── Complete Skill Map ─────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <p className="text-[var(--text-primary)] text-xl font-semibold leading-6">
              Complete Skill Map for your Target Role
            </p>
            <p className="text-[var(--text-primary)] text-sm leading-5">
              Here's what you need to qualify for your Target Role.
            </p>
            <div className="flex flex-col gap-2.5 mt-2">
              {TARGET_ROLE_SKILLS.map((skill) => (
                <SkillRow key={skill.name} skill={skill} onTap={skill.is_featured ? () => setShowTestFlow(true) : undefined} />
              ))}
            </div>
          </div>
      </div>
    </BaseSheetLayout>
  );
}

/* ── SkillRow ──────────────────────────────────────────────────────────── */

function SkillRow({ skill, onTap }: { skill: TargetRoleSkill; onTap?: () => void }) {
  const isMet = skill.current_level >= skill.target_level;
  const hasProgress = !isMet && skill.progress !== undefined;

  const content = (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between">
        <p className="text-[var(--text-primary)] text-base font-bold">{skill.name}</p>
        {isMet ? (
          <span className="text-[var(--accent)] text-sm">✓</span>
        ) : (
          <ArrowRight size={16} className="text-[var(--funnel-bar-blue)]" />
        )}
      </div>
      <LevelMeter current={skill.current_level} target={skill.target_level} variant={isMet ? "green" : "blue"} />
      <span className={`text-sm ${isMet ? "text-[var(--accent)]" : "text-[var(--text-primary)]"}`}>
        {isMet
          ? `${LEVEL_LABELS[skill.current_level] ?? "Expert"} ✓`
          : skill.current_level === 0
            ? `Novice — need ${LEVEL_LABELS[skill.target_level] ?? "Beginner"}`
            : `${LEVEL_LABELS[skill.current_level] ?? "Novice"} → ${LEVEL_LABELS[skill.target_level] ?? "Expert"}`}
      </span>
      {hasProgress && (
        <span className="text-[var(--text-secondary)] text-xs">
          {LEVEL_LABELS[skill.current_level]} → {LEVEL_LABELS[skill.target_level]}
          {" · "}{skill.progress}% complete
          {skill.module && <><br />{skill.module}</>}
        </span>
      )}
    </div>
  );

  const cls = "rounded-2xl p-4 w-full text-left pointer-events-auto";
  const bg = { background: "var(--surface-elevated)" };

  if (onTap) {
    return <button onClick={onTap} className={cls} style={bg}>{content}</button>;
  }
  return <div className={cls} style={bg}>{content}</div>;
}
