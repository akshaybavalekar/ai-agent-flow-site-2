'use client';
import { useMemo, useState } from "react";
import { Maximize2, TrendingUp, Sparkles, Target } from "lucide-react";
import { CircularGauge } from "@/components/charts/CircularGauge";
import { LearningCard } from "@/components/ui/LearningCard";
import { BaseSheetLayout } from "@/components/ui/BaseSheetLayout";
import { sendBackToProfileIntent } from "@/utils/teleIntent";
import type { SkillData, SkillProgressionItem, LearningPathNode } from "@/utils/computeProfileMetrics";
import { computeProfileMetrics } from "@/utils/computeProfileMetrics";
import { mapRawSkillProgression } from "@/utils/computeProfileMetrics";
import { useSpeechFallbackNudge } from "@/hooks/useSpeechFallbackNudge";
import { useVoiceActions } from "@/hooks/useVoiceActions";
import { LearningPathTemplate } from "./LearningPathTemplate";
import { SkillTestFlow } from "./SkillTestFlow";

/* ── Constants ────────────────────────────────────────────────────────────── */

// Hardcoded skill gaps that match LearningPathTemplate courses
const HARDCODED_SKILL_GAPS: SkillProgressionItem[] = [
  {
    name: "Kubernetes",
    current_level: 1,
    target_level: 2,
    is_featured: true,
  },
];

const RESUME_COURSES = [
  {
    id: "mlops-deployment",
    title: "MLOps / Model Deployment",
    tag: "For Target Role",
    levelFrom: "Beginner",
    levelTo: "Intermediate",
    progressPct: 55,
    module: "Module 2/4: Strategic Frameworks",
  },
  {
    id: "tech-leadership",
    title: "Technical Leadership",
    tag: "For Saved Jobs",
    levelFrom: "Novice",
    levelTo: "Beginner",
    progressPct: 38,
    module: "Module 1/3: Feedback Frameworks",
  },
];

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface Certification {
  name: string;
  imageUrl: string;
}

interface SkillCoverageSheetProps {
  rawSkillProgression?: Record<string, unknown>;
  skillData?: SkillData;
  skillCoverage?: number;
  targetRole?: string;
  certifications?: Certification[];
  candidateId?: string;
}

/* ── Component ────────────────────────────────────────────────────────────── */

export function SkillCoverageSheet({
  rawSkillProgression,
  skillData: legacyData,
  skillCoverage: overrideCoverage,
  targetRole: overrideRole,
  certifications,
  candidateId,
}: SkillCoverageSheetProps) {
  const [showLearningPath, setShowLearningPath] = useState(false);
  const [showSkillTest, setShowSkillTest] = useState(false);

  useSpeechFallbackNudge({
    enabled: true,
    requiredPhrases: ["skill", "coverage", "breakdown"],
    matchMode: "any",
    instruction:
      '[SYSTEM] SkillCoverageSheet is now visible. Say: "Here\'s a breakdown of your skills and how close you are to your target role."',
    delayMs: 1200,
  });

  const skillData = useMemo(
    () => mapRawSkillProgression(rawSkillProgression) ?? legacyData,
    [rawSkillProgression, legacyData],
  );
  const computed = useMemo(() => computeProfileMetrics(skillData), [skillData]);
  const percentage = overrideCoverage ?? computed.skillCoverage ?? 73;
  const targetRole = overrideRole ?? computed.targetRole ?? "Target Role";

  useVoiceActions(
    useMemo(() => [
      { phrases: ["close", "go back", "back to profile"], action: () => void sendBackToProfileIntent() },
    ], []),
  );

  return (
    <>
      {showSkillTest ? (
        <SkillTestFlow
          candidateId={candidateId || "10000000-0000-0000-0000-000000000001"}
          onBack={() => setShowSkillTest(false)}
          onClose={() => void sendBackToProfileIntent()}
        />
      ) : !showLearningPath ? (
        <BaseSheetLayout
          testId="skill-coverage-sheet"
          onClose={() => void sendBackToProfileIntent()}
          scrollClassName="px-6 pt-20 pb-[72px] flex flex-col gap-8"
        >
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-[var(--text-primary)] text-[32px] font-semibold leading-10">
            Skill Coverage
          </h1>
          <p className="text-[var(--text-dim)] text-base">
            How close you are to your next role.
          </p>
        </div>

        {/* Career Path Card */}
          <div className="flex gap-6 items-center">
          <CircularGauge percentage={percentage} size={105} />
          <div className="flex-1 rounded-2xl border border-[var(--bar-track)] bg-[var(--accent-contrast)] p-4 pb-[60px] flex flex-col gap-4">
            <div className="flex gap-2 items-center">
              <TrendingUp size={16} className="text-white" />
              <span className="text-white text-sm font-bold">Career Path</span>
            </div>
            <div className="relative flex flex-col pb-[5.257px]">
              <div className="relative h-1 rounded-full bg-[var(--bar-track)] w-full mb-[-5.257px]">
                <div
                  className="absolute inset-y-0 left-0 rounded-full h-1 bg-gradient-to-r from-[var(--accent-light)] from-[40%] to-[var(--accent)]"
                  style={{ width: `${Math.min(percentage, 66)}%` }}
                />
              </div>
              <div className="absolute flex justify-between left-0 top-[-6px] w-[248px]">
                <div className="flex-1 flex flex-col items-center gap-2 pb-[12.5px]">
                  <div className="size-4 rounded-full bg-[var(--accent-light)]" />
                  <span className="text-[var(--accent-light)] text-xs text-center w-[59px]">
                    Junior AI Developer
                  </span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="size-4 rounded-full bg-[var(--career-dot-mid)] border-2 border-[var(--career-dot-mid)]" />
                  <span className="text-[var(--accent)] text-xs text-center w-[60px]">
                    AI Developer
                  </span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2 pb-[12.5px]">
                  <div className="size-4 rounded-full bg-[var(--bg)] border-2 border-[var(--border-strong)]" />
                  <span className="text-[var(--text-zinc-600)] text-xs text-center">
                    Senior AI Developer
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Learning Pathway */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[var(--text-primary)] text-xl font-semibold">
              Learning Pathway
            </h2>
            <Maximize2 size={20} className="text-[var(--text-primary)]" />
          </div>
          <div className="rounded-2xl border border-[var(--bar-track)] bg-[var(--accent-contrast)] overflow-x-auto h-[333px] relative">
            <div className="absolute flex items-center" style={{ left: '-316px', top: '91.6px' }}>
              {/* Coding 101 - Completed */}
              <div className="relative shrink-0 size-20">
                <div className="absolute bg-[var(--career-node-surface)] border-2 border-[var(--accent)] rounded-full size-20 flex items-center justify-center" style={{ boxShadow: 'var(--career-node-shadow)' }}>
                  <div className="text-white text-xs font-medium text-center leading-[15px]">
                    <div>Coding</div>
                    <div>101</div>
                  </div>
                  <div className="absolute border-2 border-[var(--accent)] left-2 top-2 opacity-50 rounded-full size-[60px]" />
                </div>
              </div>
              
              {/* Line connector */}
              <div className="h-0 w-[57px] relative">
                <div className="absolute h-0.5 bg-[var(--bar-track)] w-full top-0" />
              </div>
              
              {/* Developer Basics - Completed */}
              <div className="flex flex-col items-start justify-center h-[168px] relative">
                <div className="bg-[var(--accent-strong)] border-2 border-[var(--accent)] h-10 rounded-[10px] w-[185.688px] flex items-center justify-center px-[18px]" style={{ boxShadow: 'var(--career-pill-shadow)' }}>
                  <span className="text-black text-sm font-normal">Developer Basics</span>
                  <div className="ml-2 size-4 flex items-center justify-center">
                    <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                      <path d="M1 6L6 11L15 1" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Vertical connector from Coding 101 */}
            <div className="absolute left-[23.69px] top-[175.6px] h-8 w-[101px]">
              <div className="h-full w-0.5 bg-[var(--bar-track)]" />
            </div>
            
            {/* Kubernetes - In Progress */}
            <button
              onClick={() => setShowSkillTest(true)}
              className="absolute flex flex-col gap-[7px] items-center left-[107.69px] top-[142.1px] cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="bg-[var(--funnel-bar-blue-25)] border-2 border-white rounded-full size-16 flex items-center justify-center p-0.5">
                <div className="size-8 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="white">
                    <path d="M16 4l3 3-3 3-3-3 3-3zm0 18l3 3-3 3-3-3 3-3zm10-9l3 3-3 3-3-3 3-3zM6 13l3 3-3 3-3-3 3-3z" />
                  </svg>
                </div>
              </div>
              <span className="text-white text-xs text-center w-[65px]">Kubernetes</span>
            </button>
            
            {/* Vertical connector from Kubernetes */}
            <div className="absolute left-[188.69px] top-[175.6px] h-8 w-[101px]">
              <div className="h-full w-0.5 bg-[var(--bar-track)]" />
            </div>
            
            {/* Docker & Cloud - Upcoming */}
            <div className="absolute flex flex-col gap-[9px] items-center left-[272.69px] top-[141.1px]">
              <div className="bg-[var(--bar-track)] border-2 border-[var(--border-zinc-500)] rounded-full size-16 flex items-center justify-center p-0.5">
                <div className="size-5 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="var(--text-zinc-500)">
                    <path d="M10 2L12 8H18L13 12L15 18L10 14L5 18L7 12L2 8H8L10 2Z" />
                  </svg>
                </div>
              </div>
              <span className="text-white text-xs text-center leading-4">
                Docker<br />& Cloud
              </span>
            </div>
            
            {/* Vertical connector from Docker */}
            <div className="absolute left-[353.69px] top-[175.6px] h-8 w-[101px]">
              <div className="h-full w-0.5 bg-[var(--bar-track)]" />
            </div>
            
            {/* Scalability & Performance - Upcoming */}
            <div className="absolute flex flex-col gap-[11px] items-center left-[437.69px] top-[141.1px]">
              <div className="bg-[var(--bar-track)] border-2 border-[var(--border-zinc-500)] rounded-full size-16 flex items-center justify-center p-0.5">
                <div className="size-5 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="var(--text-zinc-500)">
                    <path d="M10 2L12 8H18L13 12L15 18L10 14L5 18L7 12L2 8H8L10 2Z" />
                  </svg>
                </div>
              </div>
              <span className="text-white text-xs text-center leading-4">
                Scalability &<br />Performance
              </span>
            </div>
            
            {/* Vertical connector from Scalability */}
            <div className="absolute left-[527.69px] top-[175.6px] h-8 w-[101px]">
              <div className="h-full w-0.5 bg-[var(--bar-track)]" />
            </div>
            
            {/* Next Level tooltip */}
            <div className="absolute bg-[var(--funnel-bar-blue-10)] border-2 border-[var(--funnel-bar-blue)] rounded-[10px] left-[611.69px] top-[141.35px] w-[162.68px] p-4 pt-[14px] pb-[2px]" style={{ boxShadow: 'var(--career-next-shadow)' }}>
              <div className="text-center">
                <p className="text-[var(--funnel-bar-blue)] text-sm font-semibold">Next Level:</p>
                <p className="text-white text-base mt-1">Senior AI Developer</p>
              </div>
            </div>
          </div>
          <button
            className="flex items-center gap-1 self-end text-[var(--accent)]"
          >
            <span className="text-[13px] font-medium">View Target Role →</span>
          </button>
        </div>

        {/* Certifications */}
        <div className="flex flex-col gap-4">
          <h2 className="text-[var(--text-primary)] text-xl font-semibold">
            Certifications
          </h2>
          <div className="rounded-2xl border border-[var(--bar-track)] bg-[var(--accent-contrast)] p-4 flex flex-col gap-4">
            <div className="flex gap-2 overflow-x-auto">
              <div className="relative shrink-0 size-24">
                <img
                  src="https://www.figma.com/api/mcp/asset/6ca60d7c-c2fd-4c93-9a08-d50419e316fc"
                  alt="IT Specialist Artificial Intelligence"
                  className="size-24 object-contain"
                />
              </div>
              <div className="relative shrink-0 size-24">
                <img
                  src="https://www.figma.com/api/mcp/asset/fd517776-c9f9-4ecf-bf5c-aba02204e15c"
                  alt="IBM Generative AI Engineer"
                  className="size-24 object-contain"
                />
              </div>
              <div className="relative shrink-0 size-24">
                <img
                  src="https://www.figma.com/api/mcp/asset/103725bb-2e99-4725-af9f-84a1d406bce1"
                  alt="AWS Certified Cloud Practitioner"
                  className="size-24 object-contain"
                />
              </div>
            </div>
          </div>
          <button
            className="flex items-center gap-1 self-end text-[var(--accent)]"
          >
            <span className="text-[13px] font-medium">Add Certifications →</span>
          </button>
        </div>

        {/* We recommend learning: */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-[var(--accent)]" />
            <h2 className="text-[var(--text-primary)] text-xl font-semibold">
              We recommend learning:
            </h2>
          </div>

          <LearningCard
            title="Kubernetes"
            currentLevel={1}
            targetLevel={2}
            levelLabel="Novice → Beginner"
            onClick={() => setShowSkillTest(true)}
            description={
              <>
                <span className="font-bold">Kubernetes</span>
                {" appears as part of your Target Role and in "}
                <span className="font-bold">3 of your saved jobs</span>
                {"."}
              </>
            }
          />
        </div>

        {/* Pick up where you left off */}
        <div className="flex flex-col gap-4">
          <h2 className="text-[var(--text-primary)] text-xl font-semibold">
            Pick up where you left off:
          </h2>
          <div className="flex flex-col gap-3">
            {/* MLOps / Model Deployment */}
            <LearningCard
              title="MLOps / Model Deployment"
              currentLevel={2}
              targetLevel={3}
              levelLabel="Beginner → Intermediate · 55% complete"
              module="Module 2/4: Strategic Frameworks"
              tag={{ label: "For Target Role", icon: <Target size={14} className="text-[var(--funnel-bar-blue)]" />, variant: "blue" }}
            />

            {/* Technical Leadership */}
            <LearningCard
              title="Technical Leadership"
              currentLevel={1}
              targetLevel={2}
              levelLabel="Novice → Beginner · 38% complete"
              module="Module 1/3: Feedback Frameworks"
              tag={{
                label: "For Saved Jobs",
                icon: (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--funnel-bar-blue)]">
                    <path d="M8 2L10 6L14 6L11 9L12 13L8 10L4 13L5 9L2 6L6 6L8 2Z" fill="currentColor"/>
                  </svg>
                ),
                variant: "blue",
              }}
            />
          </div>
        </div>

        </BaseSheetLayout>
      ) : (
        <LearningPathTemplate
          candidateId={candidateId || "10000000-0000-0000-0000-000000000001"}
          jobTitle={targetRole}
          onClose={() => setShowLearningPath(false)}
        />
      )}
    </>
  );
}

