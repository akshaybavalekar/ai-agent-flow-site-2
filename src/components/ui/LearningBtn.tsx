'use client';

import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { motion } from "motion/react";
import { notifyTele } from "@/utils/teleUtils";
import { useCurrentSection } from "@/contexts/CurrentSectionContext";
import { navigateClientToMyLearning } from "@/utils/clientDashboardNavigate";

const TEMPLATES_WITH_CLOSE_BTN = new Set([
  "SkillsDetail",
  "SkillCoverageSheet",
  "SkillTestFlow",
  "MarketRelevanceDetail",
  "CareerGrowthDetail",
  "MarketRelevanceSheet",
  "CareerGrowthSheet",
  "MyLearningSheet",
  "JobSearchSheet",
  "JobDetailSheet",
  "EligibilitySheet",
  "JobApplicationsSheet",
  "PastApplicationsSheet",
  "CardStackJobPreviewSheet",
  "TargetRoleSheet",
]);

export function LearningBtn() {
  const [active, setActive] = useState(false);
  const { effectiveTemplateId } = useCurrentSection();

  const hasCloseBtn = TEMPLATES_WITH_CLOSE_BTN.has(effectiveTemplateId ?? "");

  const handleClick = () => {
    if (navigateClientToMyLearning()) {
      void notifyTele("user clicked: my learning", { skipNavigateDrift: true });
    } else {
      void notifyTele("user clicked: my learning");
    }
  };

  const rightOffset = hasCloseBtn
    ? "calc(5rem + env(safe-area-inset-right, 0px))"
    : "calc(1rem + env(safe-area-inset-right, 0px))";

  return (
    <button
      data-testid="learning-btn"
      onClick={handleClick}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onTouchStart={() => setActive(true)}
      onTouchEnd={() => setActive(false)}
      className="absolute pointer-events-auto transition-all duration-200 active:scale-95"
      style={{
        zIndex: 125,
        right: rightOffset,
        top: "calc(1rem + env(safe-area-inset-top, 0px))",
      }}
      aria-label="Go to my learning"
    >
      <motion.div
        className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300"
        animate={{
          scale: 1,
          boxShadow: active
            ? "0px 0px 20px 0px var(--accent-strong)"
            : "0px 0px 0px 0px transparent",
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{
          background: "var(--surface-muted)",
          border: `1px solid ${active ? "var(--accent-strong)" : "var(--border-strong)"}`,
        }}
      >
        <GraduationCap size={18} style={{ color: `${active ? "var(--accent)" : "var(--text-primary)"}` }} />
      </motion.div>
    </button>
  );
}
