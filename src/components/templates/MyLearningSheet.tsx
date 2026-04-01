'use client';
import { useState, useMemo, useEffect } from "react";
import { X, ChevronDown, ChevronUp, Video, BookOpen, Terminal, ChevronRight, Copy } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LearningCard } from "@/components/ui/LearningCard";
import { BaseSheetLayout } from "@/components/ui/BaseSheetLayout";
import { completeLearning, prefetchAfterLearning } from "@/platform/mcpBridge";
import { notifyTele } from "@/utils/teleUtils";
import { useSpeechFallbackNudge } from "@/hooks/useSpeechFallbackNudge";
import { useVoiceActions, type VoiceAction } from "@/hooks/useVoiceActions";
import { useMcpCache } from "@/contexts/McpCacheContext";
import { extractGaugeScores } from "@/utils/computeProfileMetrics";
import { CircularGauge } from "@/components/charts/CircularGauge";
import { navigateClientToDashboardLanding, navigateClientToTargetRole } from "@/utils/clientDashboardNavigate";
import { clearLearningCompleted } from "@/utils/visitorMemory";

/* ── Types ──────────────────────────────────────────────────────────────── */

type PlanPhase = "plan" | "customize" | "my-learning" | "lesson-video" | "lesson-reading" | "results";
type LessonType = "VIDEO" | "READING" | "HANDS-ON";
type Provider = "aws" | "pearson" | "google-cloud";

interface LessonItem {
  type: LessonType;
  duration: string;
  title: string;
  provider: Provider;
}

interface PlanSection {
  id: string;
  number: number;
  title: string;
  lessonCount: string;
  lessons: LessonItem[];
}

interface TopicOption {
  name: string;
  subtitle: string;
  hours: string;
}

interface MyLearningSheetProps {
  candidateId?: string;
  /** Starting phase — "my-learning" when opened as a template, "plan" from SkillTestFlow */
  initialPhase?: PlanPhase;
  /** X button — returns to SkillTestFlow landing */
  onBack?: () => void;
  /** Finish Course — calls completeLearning then navigates to ProfileSheet */
  onClose?: () => void;
}

/* ── Data ────────────────────────────────────────────────────────────────── */

const SECTIONS_BASE: PlanSection[] = [
  {
    id: "s1",
    number: 1,
    title: "Container Fundamentals",
    lessonCount: "3 lessons",
    lessons: [
      { type: "VIDEO",    duration: "30 min", title: "Introduction to Kubernetes",  provider: "aws" },
      { type: "READING",  duration: "15 min", title: "Building Your First Cluster", provider: "pearson" },
      { type: "HANDS-ON", duration: "45 min", title: "Hands-on Lab Setup",           provider: "google-cloud" },
    ],
  },
  {
    id: "s2",
    number: 2,
    title: "Level-up Validation",
    lessonCount: "3 lessons + test",
    lessons: [
      { type: "VIDEO",    duration: "30 min", title: "Production Strategies",    provider: "pearson" },
      { type: "READING",  duration: "15 min", title: "Performance Optimization", provider: "aws" },
      { type: "HANDS-ON", duration: "45 min", title: "Real-world Scenario Lab",  provider: "aws" },
    ],
  },
];

const SECTION_OPERATORS: PlanSection = {
  id: "s3",
  number: 3,
  title: "Deep Dive: Operators",
  lessonCount: "3 lessons",
  lessons: [
    { type: "VIDEO",    duration: "30 min", title: "Kubernetes Operators Fundamentals", provider: "aws" },
    { type: "READING",  duration: "15 min", title: "Custom Resource Definitions",        provider: "pearson" },
    { type: "HANDS-ON", duration: "45 min", title: "Build Your First Operator",          provider: "google-cloud" },
  ],
};

const FORMAT_OPTIONS = [
  "More video",
  "More hands-on",
  "More reading",
  "More conversations",
  "Balanced mix",
];

const TOPIC_OPTIONS: TopicOption[] = [
  { name: "Helm Charts",           subtitle: "Used in 3 of your saved jobs",    hours: "+2 hours"   },
  { name: "Kubernetes Operators",  subtitle: "Required for Senior AI Architect", hours: "+3 hours"   },
  { name: "Service Mesh Advanced", subtitle: "Used in 2 of your saved jobs",     hours: "+2.5 hours" },
  { name: "Cloud-Native Security", subtitle: "High demand in market",            hours: "+1.5 hours" },
];

/* ── Sub-components ──────────────────────────────────────────────────────── */

function ProviderLogo({ provider }: { provider: Provider }) {
  const base = "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden";
  if (provider === "aws") {
    return (
      <div className={base} style={{ background: "var(--brand-aws)" }}>
        <img
          src="https://cdn.simpleicons.org/amazonaws/FF9900"
          alt="AWS"
          className="w-5 h-5"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </div>
    );
  }
  if (provider === "pearson") {
    return (
      <div className={base} style={{ background: "var(--brand-pearson)" }}>
        <span className="text-white text-sm font-bold">P</span>
      </div>
    );
  }
  return (
    <div className={base} style={{ background: "var(--text-primary)" }}>
      <img
        src="https://cdn.simpleicons.org/googlecloud"
        alt="GCP"
        className="w-5 h-5"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    </div>
  );
}

function LessonTypeBadge({ type, duration }: { type: LessonType; duration: string }) {
  const Icon = type === "VIDEO" ? Video : type === "READING" ? BookOpen : Terminal;
  const color =
    type === "VIDEO" ? "var(--lesson-video)" : type === "READING" ? "var(--lesson-reading)" : "var(--lesson-handson)";
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={12} style={{ color }} />
      <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color }}>
        {type}
      </span>
      <span className="text-[var(--text-muted)] text-[11px]">· {duration}</span>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────────── */

export function MyLearningSheet({ candidateId, initialPhase = "my-learning", onBack, onClose }: MyLearningSheetProps) {
  const [phase, setPhase] = useState<PlanPhase>(initialPhase);
  const [expandedSection, setExpandedSection] = useState<string | null>("s1");

  useEffect(() => {
    clearLearningCompleted();
    // Skill/market/career data: from agent tools + navigateToSection — not client POST /api/invoke.
  }, []); // Run once on mount

  useEffect(() => {
    if (candidateId) void prefetchAfterLearning(candidateId);
  }, [candidateId]);

  useEffect(() => {
    const messages: Record<PlanPhase, string> = {
      "my-learning": '[SYSTEM] My Learning Dashboard is visible. Say: "Welcome to your learning dashboard. You can pick up where you left off or start a new course to build your skills."',
      "plan": '[SYSTEM] Learning Plan view is visible. Say: "Here\'s a Kubernetes learning plan for you. It will take you to the Beginner level."',
      "customize": '[SYSTEM] Customize view is visible. Say: "Great! You can customize your learning experience. Pick your preferred formats, add more topics, or adjust the difficulty level to match your goals."',
      "lesson-video": '[SYSTEM] Lesson video is visible. Say: "Let\'s begin with the first lesson. This covers the fundamentals of Kubernetes containers. Take your time and let me know when you\'re ready to continue."',
      "lesson-reading": '[SYSTEM] Lesson reading is visible. Say: "This reading will help you understand Pods and how to build your first cluster. Take your time to review the examples. When you\'re done, we\'ll wrap up the course."',
      "results": '[SYSTEM] Learning results are visible. Say: "Congratulations! You\'ve completed your Kubernetes learning path. You are now at Beginner level, and your skill coverage has increased to 82%. I\'ve also updated your Market Relevance and other metrics."',
    };

    const message = messages[phase];
    if (message) {
      notifyTele(message);
    }
  }, [phase]);
  
  const cache = useMcpCache();
  const gaugeScores = useMemo(() => {
    const skillCov = extractGaugeScores(cache.skills).skillCoverage;
    const marketRel = (cache.marketRelevance as Record<string, unknown> | null)?.overall_score as number | undefined;
    
    return {
      skillCoverage: skillCov,
      marketRelevance: marketRel,
      careerGrowth: undefined,
    };
  }, [cache.skills, cache.marketRelevance, phase]);
  
  const [selectedFormat, setSelectedFormat] = useState("Balanced mix");
  const [pendingFormat, setPendingFormat] = useState("Balanced mix");
  const [topicToggles, setTopicToggles] = useState<Record<string, boolean>>({
    "Kubernetes Operators": true,
  });
  const [pendingToggles, setPendingToggles] = useState<Record<string, boolean>>({
    "Kubernetes Operators": true,
  });
  const [hasOperators, setHasOperators] = useState(false);
  const [planUpdated, setPlanUpdated] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const sections = useMemo(
    () => (hasOperators ? [...SECTIONS_BASE, SECTION_OPERATORS] : SECTIONS_BASE),
    [hasOperators],
  );

  const toggleSection = (id: string) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  };

  const handleUpdatePlan = () => {
    setSelectedFormat(pendingFormat);
    setTopicToggles({ ...pendingToggles });
    setHasOperators(!!pendingToggles["Kubernetes Operators"]);
    setPlanUpdated(true);
    setExpandedSection("s1");
    setPhase("plan");
  };

  const handleFinishCourse = async () => {
    if (submitting) return;
    setSubmitting(true);
    if (candidateId) await completeLearning(candidateId);
    setSubmitting(false);
    setPhase("results");
  };

  const handleMyLearningClose = () => {
    const isFromLearning = phase === "results";
    navigateClientToDashboardLanding(isFromLearning);
  };

  /* Speech nudges */
  useSpeechFallbackNudge({
    enabled: phase === "my-learning",
    requiredPhrases: ["learning"],
    matchMode: "any",
    instruction:
      '[SYSTEM] MyLearningSheet is now visible. Say: "Here\'s your learning dashboard. Pick up where you left off or start a new course."',
    delayMs: 1200,
  });

  useSpeechFallbackNudge({
    enabled: phase === "plan" && !planUpdated,
    requiredPhrases: ["learning plan", "kubernetes"],
    matchMode: "any",
    instruction:
      '[SYSTEM] MyLearningSheet is visible. Say: "Here\'s a Kubernetes learning plan for you. It will take you to the Beginner level."',
    delayMs: 800,
  });

  useSpeechFallbackNudge({
    enabled: phase === "plan" && planUpdated,
    requiredPhrases: ["operators", "balanced"],
    matchMode: "any",
    instruction:
      "[SYSTEM] Updated Kubernetes plan is visible. Say: \"OK. I've added a section on Operators and kept the learning formats balanced.\"",
    delayMs: 600,
  });

  useSpeechFallbackNudge({
    enabled: phase === "customize",
    requiredPhrases: ["format", "topics"],
    matchMode: "any",
    instruction:
      "[SYSTEM] Customize plan is visible. Say: \"You can pick preferred formats, or add more topics to the plan.\"",
    delayMs: 600,
  });

  useSpeechFallbackNudge({
    enabled: phase === "lesson-video",
    requiredPhrases: ["lesson", "fundamentals"],
    matchMode: "any",
    instruction:
      '[SYSTEM] Lesson video is visible. Say: "Let\'s begin with the first lesson. This covers the fundamentals of Kubernetes containers. Take your time and let me know when you\'re ready to continue."',
    delayMs: 600,
  });

  useSpeechFallbackNudge({
    enabled: phase === "lesson-reading",
    requiredPhrases: ["reading", "pods"],
    matchMode: "any",
    instruction:
      '[SYSTEM] Lesson reading is visible. Say: "This reading will help you understand Pods and how to build your first cluster. When you\'re done, we\'ll wrap up the course."',
    delayMs: 600,
  });

  useSpeechFallbackNudge({
    enabled: phase === "results",
    requiredPhrases: ["way to go", "beginner"],
    matchMode: "any",
    instruction:
      '[SYSTEM] Learning results are visible. Say: "Way to go! You are now at Beginner level for Kubernetes. I\'ve updated your profile and your skill coverage has increased."',
    delayMs: 600,
  });

  useVoiceActions(
    useMemo<VoiceAction[]>(
      () =>
        phase === "my-learning"
          ? [
              { phrases: ["close", "go back", "dashboard", "back"], action: handleMyLearningClose },
              { phrases: ["target role", "view target role", "my target role"], action: () => navigateClientToTargetRole() },
            ]
          : [],
      [phase],
    ),
  );

  /* ── My Learning (full-screen dashboard) ── */
  if (phase === "my-learning") {
    return (
      <BaseSheetLayout
        testId="my-learning"
        onClose={onBack ? onBack : handleMyLearningClose}
        zClass="z-[60]"
        animate={false}
        scrollClassName="px-5 pb-10"
        header={
          <div className="px-5 pt-14 pb-6">
            <h1 className="text-[var(--text-primary)] text-3xl font-bold">My Learning</h1>
            <p className="text-[var(--text-muted)] text-sm mt-1">Here you can pick your next course or lesson.</p>
          </div>
        }
      >

        <div className="flex flex-col gap-6">
          {/* ── We recommend learning ── */}
          <div>
            <p className="text-[var(--text-primary)] text-base font-bold mb-3 flex items-center gap-1.5">
              <span style={{ color: "var(--accent)" }}>✦✦</span> We recommend learning:
            </p>
            <LearningCard
              title="Kubernetes"
              currentLevel={1}
              targetLevel={2}
              meterVariant="green"
              levelLabel="Novice → Beginner"
              onClick={() => setPhase("plan")}
              rightIcon={<ChevronRight size={18} style={{ color: "var(--accent)" }} />}
              description={
                <>
                  <span className="font-semibold">Kubernetes</span> appears as part of your Target Role and in{" "}
                  <span className="font-semibold">3 of your saved jobs</span>.
                </>
              }
            />
          </div>

          {/* ── Pick up where you left off ── */}
          <div>
            <p className="text-[var(--text-primary)] text-base font-bold mb-3">Pick up where you left off:</p>
            <div className="flex flex-col gap-3">

              {/* MLOps / Model Deployment */}
              <LearningCard
                title="MLOps / Model Deployment"
                currentLevel={2}
                targetLevel={3}
                meterVariant="green"
                levelLabel="Beginner → Intermediate · 55% complete"
                module="Module 2/4: Strategic Frameworks"
                rightIcon={<ChevronRight size={18} className="text-[var(--text-muted)]" />}
                tag={{
                  label: "For Target Role",
                  icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>,
                  variant: "green",
                }}
              />

              {/* Technical Leadership */}
              <LearningCard
                title="Technical Leadership"
                currentLevel={1}
                targetLevel={2}
                meterVariant="green"
                levelLabel="Novice → Beginner · 38% complete"
                module="Module 1/3: Feedback Frameworks"
                rightIcon={<ChevronRight size={18} className="text-[var(--text-muted)]" />}
                tag={{
                  label: "For Saved Jobs",
                  icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
                  variant: "blue",
                }}
              />

            </div>
          </div>
        </div>
      </BaseSheetLayout>
    );
  }

  /* ── Lesson: Video ── */
  if (phase === "lesson-video") {
    return (
      <div
        className="fixed inset-0 z-50 flex min-h-full flex-col bg-[#09090b] bg-gradient-to-b from-[rgba(30,210,94,0.05)] to-[rgba(54,137,255,0.05)] no-lightboard overflow-y-auto"
        data-testid="lesson-video"
      >
        <div className="px-4 pt-10 pb-3">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setPhase("plan")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(28,28,30,0.2)] no-lightboard"
              aria-label="Close"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Video size={14} className="shrink-0 text-[#1ed25e]" aria-hidden />
            <span className="whitespace-nowrap text-[11px] font-normal uppercase leading-[16.5px] text-white">
              video
            </span>
            <span className="text-[11px] leading-[16.5px] text-white">·</span>
            <span className="whitespace-nowrap text-[11px] leading-[16.5px] text-white">30 min</span>
          </div>
          <h1 className="mt-2 text-[16px] font-bold leading-6 text-[#fafafa]">
            Introduction to Kubernetes
          </h1>
        </div>

        <div className="mx-4 rounded-2xl overflow-hidden border border-white/[0.08]">
          <div className="relative flex items-center justify-center bg-[rgba(24,24,27,0.74)] min-h-[200px]">
            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[rgba(54,137,255,0.35)] border-2 border-[rgba(54,137,255,0.6)]">
              <div className="flex items-center gap-[3px]">
                <div className="w-[5px] h-4 rounded-sm bg-white" />
                <div className="w-[5px] h-4 rounded-sm bg-white" />
              </div>
            </div>
            <p className="absolute bottom-3 left-0 right-0 text-center text-white/80 text-sm">
              Video in progress...
            </p>
          </div>
          <div className="px-4 py-3 bg-[rgba(24,24,27,0.5)]">
            <div className="flex h-1 rounded-full overflow-hidden w-full bg-white/10">
              <div className="h-full rounded-full w-[40%] bg-[#1dc558]" />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-white/60 text-xs">16 min</span>
              <span className="text-white/60 text-xs">40 min</span>
            </div>
          </div>
        </div>

        <div className="px-4 mt-4">
          <p className="text-[#fafafa] text-base font-bold leading-6 mb-1">What you&apos;re learning</p>
          <p className="text-[#f4f4f5] text-[13px] leading-5">
            In this hands-on lab, you&apos;ll create a Dockerfile, build an image, and run your first
            container. You&apos;ll learn best practices for layer caching and multi-stage builds.
          </p>
        </div>

        <div className="px-4 mt-4">
          <div className="flex flex-col gap-1">
            <p className="text-[#fafafa] text-base font-bold leading-6">Timestamps</p>
            <div className="text-[#f4f4f5] text-[13px] leading-5 flex flex-col gap-0">
              {[
                ["0:00", "Why containers exist"],
                ["9:30", "How containers differ from virtual machines"],
                ["17:00", "Building your first container image"],
                ["26:00", "Managing containers with Docker commands"],
              ].map(([time, label]) => (
                <p key={time}>
                  {time} - {label}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-4 mt-4 rounded-2xl glass-surface p-4">
          <p className="text-[#fafafa] text-base font-bold leading-6 mb-1">Next:</p>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-[#1ed25e] shrink-0" aria-hidden />
              <span className="text-[11px] uppercase text-white tracking-wide">reading</span>
              <span className="text-[11px] text-white">·</span>
              <span className="text-[11px] text-white">15 min</span>
            </div>
            <p className="text-[#fafafa] text-base font-bold leading-6">
              Building Your First Cluster
            </p>
          </div>
        </div>

        <div className="px-4 pb-8 mt-4 flex justify-end safe-bottom">
          <button
            type="button"
            onClick={() => setPhase("lesson-reading")}
            className="inline-flex items-center justify-center gap-2 rounded-[24px] px-4 py-3 no-lightboard bg-[#1dc558] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
          >
            <span className="text-[#18181b] text-base font-semibold leading-6">Next Lesson</span>
            <ChevronRight size={16} className="text-[#18181b] shrink-0" aria-hidden />
          </button>
        </div>
      </div>
    );
  }

  /* ── Lesson: Reading ── */
  if (phase === "lesson-reading") {
    const yamlSnippet = `apiVersion: v1
kind: Pod
metadata:
  name: my-web-app
spec:
  containers:
  - name: web
    image: my-web-app:1.0
    ports:
    - containerPort: 8080`;

    return (
      <div
        className="fixed inset-0 z-50 flex min-h-full flex-col bg-[#09090b] bg-gradient-to-b from-[rgba(30,210,94,0.05)] to-[rgba(54,137,255,0.05)] no-lightboard overflow-y-auto"
        data-testid="lesson-reading"
      >
        <div className="px-4 pt-10 pb-3">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setPhase("plan")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(28,28,30,0.2)] no-lightboard"
              aria-label="Close"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <BookOpen size={14} className="shrink-0 text-[#60a5fa]" aria-hidden />
            <span className="whitespace-nowrap text-[11px] font-normal uppercase leading-[16.5px] text-white">
              reading
            </span>
            <span className="text-[11px] leading-[16.5px] text-white">·</span>
            <span className="whitespace-nowrap text-[11px] leading-[16.5px] text-white">15 min</span>
          </div>
          <h1 className="mt-2 text-[16px] font-bold leading-6 text-[#fafafa]">
            Building your First Cluster
          </h1>
        </div>

        <div className="px-4 flex flex-col gap-4 pb-4">
          <div>
            <p className="text-[20px] font-semibold leading-6 text-[#fafafa] mb-3">
              Understanding Pods: The Smallest Unit in Kubernetes
            </p>
            <p className="text-[#f4f4f5] text-[16px] leading-6 mb-4">
              Every application you run in Kubernetes lives inside a Pod. Before you can deploy,
              scale, or troubleshoot anything, you need to understand what a Pod actually is and why
              Kubernetes doesn&apos;t just run containers directly.
            </p>
            <p className="text-[#f4f4f5] text-[16px] leading-6">
              Consider a simple example. You have a web application packaged as a container image. To
              run it in Kubernetes, you define a Pod specification — a short YAML file that tells
              Kubernetes which image to use, which port your app listens on, and any environment
              variables it needs. Kubernetes reads the specification, finds a node in the cluster
              with available resources, and starts the Pod there.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-[rgba(24,24,27,0.74)]">
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-white/[0.08]">
              <span className="text-[11px] font-mono text-white/50 lowercase">yaml</span>
              <button
                type="button"
                className="p-1 rounded-md text-white/50 hover:text-white/80 hover:bg-white/5 no-lightboard"
                aria-label="Copy code"
                onClick={() => void navigator.clipboard.writeText(yamlSnippet)}
              >
                <Copy size={14} aria-hidden />
              </button>
            </div>
            <pre className="px-4 py-3 text-[13px] font-mono leading-relaxed overflow-x-auto whitespace-pre text-left">
              <span style={{ color: "var(--code-key)" }}>apiVersion</span>
              <span style={{ color: "var(--code-value)" }}>: v1{"\n"}</span>
              <span style={{ color: "var(--code-key)" }}>kind</span>
              <span style={{ color: "var(--code-value)" }}>: Pod{"\n"}</span>
              <span style={{ color: "var(--code-key)" }}>metadata</span>
              <span style={{ color: "var(--code-value)" }}>:{"\n"}  </span>
              <span style={{ color: "var(--code-key)" }}>name</span>
              <span style={{ color: "var(--code-value)" }}>: my-web-app{"\n"}</span>
              <span style={{ color: "var(--code-key)" }}>spec</span>
              <span style={{ color: "var(--code-value)" }}>:{"\n"}  </span>
              <span style={{ color: "var(--code-key)" }}>containers</span>
              <span style={{ color: "var(--code-value)" }}>:{"\n"}  - </span>
              <span style={{ color: "var(--code-key)" }}>name</span>
              <span style={{ color: "var(--code-value)" }}>: web{"\n"}    </span>
              <span style={{ color: "var(--code-key)" }}>image</span>
              <span style={{ color: "var(--code-value)" }}>: my-web-app:</span>
              <span style={{ color: "var(--code-number)" }}>1.0</span>
              <span style={{ color: "var(--code-value)" }}>{"\n"}    </span>
              <span style={{ color: "var(--code-key)" }}>ports</span>
              <span style={{ color: "var(--code-value)" }}>:{"\n"}    - </span>
              <span style={{ color: "var(--code-key)" }}>containerPort</span>
              <span style={{ color: "var(--code-value)" }}>: </span>
              <span style={{ color: "var(--code-number)" }}>8080</span>
            </pre>
          </div>

          <div className="flex justify-end safe-bottom pb-6">
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleFinishCourse()}
              className="inline-flex items-center justify-center gap-2 rounded-[24px] px-4 py-3 no-lightboard bg-[#1dc558] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] transition-opacity disabled:opacity-60"
            >
              <span className="text-[#18181b] text-base font-semibold leading-6">
                {submitting ? "Saving..." : "Finish Course"}
              </span>
              {!submitting && <ChevronRight size={16} className="text-[#18181b] shrink-0" aria-hidden />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Plan + Customize (transparent overlay — avatar shows through) ── */
  return (
    <div className="fixed inset-0 z-[110] pointer-events-none no-lightboard">
      <button
        onClick={() => onBack ? onBack() : navigateClientToDashboardLanding()}
        className="absolute top-4 right-4 z-10 size-10 rounded-full flex items-center justify-center bg-[var(--surface-elevated)] pointer-events-auto no-lightboard"
        aria-label="Close"
      >
        <X size={20} className="text-[var(--text-primary)]" />
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="absolute bottom-32 left-4 right-4 pointer-events-auto"
        >
          {/* ── Plan view ── */}
          {phase === "plan" && (
            <div className="flex flex-col gap-3">
              <div className="rounded-2xl glass-surface overflow-hidden max-h-[48vh] flex flex-col min-h-0">
                <div className="overflow-y-auto min-h-0 flex-1">
                  {sections.map((section, sIdx) => (
                    <div
                      key={section.id}
                      style={{
                        borderBottom:
                          sIdx < sections.length - 1
                            ? "1px solid var(--border-subtle)"
                            : "none",
                      }}
                    >
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left no-lightboard"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{
                              background:
                                "color-mix(in srgb, var(--accent) 15%, transparent)",
                              color: "var(--accent)",
                              border:
                                "1.5px solid color-mix(in srgb, var(--accent) 35%, transparent)",
                            }}
                          >
                            {section.number}
                          </div>
                          <p className="text-[var(--text-primary)] text-sm font-bold">
                            {section.title} ({section.lessonCount})
                          </p>
                        </div>
                        {expandedSection === section.id ? (
                          <ChevronUp size={16} className="text-[var(--text-muted)] shrink-0" />
                        ) : (
                          <ChevronDown
                            size={16}
                            className="text-[var(--text-muted)] shrink-0"
                          />
                        )}
                      </button>

                      <AnimatePresence initial={false}>
                        {expandedSection === section.id && (
                          <motion.div
                            key="lessons"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-3 flex flex-col gap-2">
                              {section.lessons.map((lesson) => (
                                <div
                                  key={lesson.title}
                                  className="flex items-center gap-3 rounded-xl p-3"
                                  style={{
                                    background: "var(--surface-elevated)",
                                    border: "1px solid var(--border-subtle)",
                                  }}
                                >
                                  <ProviderLogo provider={lesson.provider} />
                                  <div className="flex-1 min-w-0">
                                    <LessonTypeBadge
                                      type={lesson.type}
                                      duration={lesson.duration}
                                    />
                                    <p className="text-[var(--text-primary)] text-sm font-semibold mt-0.5 leading-snug">
                                      {lesson.title}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-stretch justify-stretch">
                <button
                  type="button"
                  onClick={() => {
                    setPendingFormat(selectedFormat);
                    setPendingToggles({ ...topicToggles });
                    setPhase("customize");
                  }}
                  className="min-w-0 flex-1 rounded-[24px] px-4 py-3 flex items-center justify-center no-lightboard bg-[rgba(16,42,40,0.2)]"
                >
                  <span className="text-[#f4f4f5] text-base font-normal leading-6 text-center">
                    Customize this plan
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPhase("my-learning")}
                  className="min-w-0 flex-1 rounded-[24px] px-4 py-3 flex items-center justify-center no-lightboard bg-[rgba(16,42,40,0.2)]"
                >
                  <span className="text-[#f4f4f5] text-base font-normal leading-6 text-center">
                    Add to my learning
                  </span>
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setPhase("lesson-video")}
                  className="inline-flex items-center justify-center gap-2 rounded-[24px] px-4 py-3 no-lightboard bg-[#1dc558] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
                >
                  <span className="text-[#18181b] text-base font-semibold leading-6">
                    Start Learning
                  </span>
                  <ChevronRight size={16} className="text-[#18181b] shrink-0" aria-hidden />
                </button>
              </div>
            </div>
          )}

          {/* ── Customize plan ── */}
          {phase === "customize" && (
            <div className="flex flex-col gap-3">
              <div
                className="overflow-y-auto flex flex-col gap-3"
                style={{ maxHeight: "50vh" }}
              >
                <div className="rounded-2xl px-4 pt-4 pb-3 glass-surface">
                  <p className="text-[var(--text-primary)] font-bold text-base mb-2">
                    Preferred Format
                  </p>
                  <div className="flex flex-col gap-2">
                    {[FORMAT_OPTIONS.slice(0, 3), FORMAT_OPTIONS.slice(3, 5)].map(
                      (row, rowIdx) => (
                        <div key={rowIdx} className="grid grid-cols-3 gap-2">
                          {row.map((fmt) => {
                            const selected = pendingFormat === fmt;
                            return (
                              <button
                                key={fmt}
                                type="button"
                                onClick={() => setPendingFormat(fmt)}
                                className={
                                  "min-w-0 flex items-center justify-center rounded-full px-2 py-2 text-[12px] font-medium leading-tight transition-all no-lightboard border border-solid text-center whitespace-nowrap sm:px-4 sm:text-[13px] sm:leading-[19.5px] " +
                                  (selected
                                    ? "bg-[#1ed25e] text-[#09090b] border-transparent"
                                    : "bg-[rgba(255,255,255,0.05)] text-[#fafafa] border-[rgba(255,255,255,0.08)]")
                                }
                              >
                                {fmt}
                              </button>
                            );
                          })}
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div className="rounded-2xl p-4 glass-surface">
                  <p className="text-[var(--text-primary)] font-bold text-base mb-3">
                    Additional Topics
                  </p>
                  <div className="flex flex-col gap-4">
                    {TOPIC_OPTIONS.map((topic) => {
                      const isOn = !!pendingToggles[topic.name];
                      return (
                        <div
                          key={topic.name}
                          className="flex items-center justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-[var(--text-primary)] text-sm font-semibold">
                              {topic.name}
                            </p>
                            <p className="text-[var(--text-muted)] text-xs">{topic.subtitle}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[var(--text-muted)] text-xs">
                              {topic.hours}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setPendingToggles((prev) => ({
                                  ...prev,
                                  [topic.name]: !prev[topic.name],
                                }))
                              }
                              className="relative w-11 h-6 rounded-full transition-colors shrink-0 no-lightboard"
                              style={{
                                background: isOn ? "#1dc558" : "rgba(63, 63, 70, 0.9)",
                              }}
                            >
                              <motion.div
                                animate={{ x: isOn ? 22 : 2 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 500,
                                  damping: 30,
                                }}
                                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                              />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-stretch">
                <button
                  type="button"
                  onClick={() => setPhase("plan")}
                  className="min-w-0 flex-1 rounded-[24px] px-4 py-3 flex items-center justify-center no-lightboard bg-[rgba(16,42,40,0.2)]"
                >
                  <span className="text-[#f4f4f5] text-base font-normal leading-6">
                    Go back
                  </span>
                </button>
                <div className="min-w-0 flex-1 flex justify-end">
                  <button
                    type="button"
                    onClick={handleUpdatePlan}
                    className="inline-flex items-center justify-center gap-2 rounded-[24px] px-4 py-3 no-lightboard bg-[#1dc558] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
                  >
                    <span className="text-[#18181b] text-base font-semibold leading-6">
                      Update my plan
                    </span>
                    <ChevronRight size={16} className="text-[#18181b] shrink-0" aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Results (After Learning Completion) ── */}
          {phase === "results" && (
            <div className="flex flex-col gap-3">
              <div className="rounded-2xl glass-surface p-4 flex flex-col gap-2">
                <h3 className="text-[#f4f4f5] text-base font-bold leading-6">Kubernetes</h3>
                
                <div className="relative h-1.5 w-full">
                  <div className="absolute bg-[#3689ff] h-1.5 left-0 rounded-full top-0 w-[73px]" />
                  <div className="absolute bg-[#3689ff] border border-[#3689ff] h-1.5 left-[75px] rounded-full top-0 w-[73px]" />
                  <div className="absolute bg-[rgba(255,255,255,0.33)] h-1.5 left-[150px] rounded-full top-0 w-[74px]" />
                  <div className="absolute bg-[rgba(255,255,255,0.33)] h-1.5 left-[226px] rounded-full top-0 w-[73px]" />
                  <div className="absolute bg-[rgba(255,255,255,0.33)] h-1.5 left-[301px] rounded-full top-0 w-[73px]" />
                </div>
                
                <span className="text-[#1dc558] text-sm leading-4 font-semibold">Beginner</span>
              </div>

              <div className="rounded-2xl glass-surface p-2 flex items-center justify-between gap-6">
                <div className="flex flex-col items-center gap-3 flex-1">
                  <CircularGauge percentage={gaugeScores.skillCoverage} size={105} />
                  <div className="flex items-center gap-1 px-2">
                    <span className="text-[#1dc558] text-sm font-normal leading-4 text-center">
                      Skill{'\n'}Coverage
                    </span>
                    <ChevronRight size={24} className="text-[#1dc558]" />
                  </div>
                </div>
                
                <div className="flex flex-col items-center gap-3 flex-1">
                  <CircularGauge percentage={gaugeScores.marketRelevance} size={105} />
                  <div className="flex items-center gap-1 px-2">
                    <span className="text-[#1dc558] text-sm font-normal leading-4 text-center whitespace-pre">
                      Market{'\n'}Relevance
                    </span>
                    <ChevronRight size={24} className="text-[#1dc558]" />
                  </div>
                </div>
                
                <div className="flex flex-col items-center gap-3 flex-1">
                  <CircularGauge percentage={gaugeScores.careerGrowth} size={105} />
                  <div className="flex items-center gap-1 px-2">
                    <span className="text-[#1dc558] text-sm font-normal leading-4 text-center">
                      Career{'\n'}Growth
                    </span>
                    <ChevronRight size={24} className="text-[#1dc558]" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onClose ? onClose() : navigateClientToDashboardLanding(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-[24px] px-4 py-3 text-[#18181b] no-lightboard bg-[#1dc558] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
                >
                  <span className="text-base font-semibold leading-6">Back to Profile</span>
                  <ChevronRight size={16} className="shrink-0" aria-hidden />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
