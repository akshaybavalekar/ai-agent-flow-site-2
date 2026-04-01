'use client';
import type { ReactNode } from "react";
import { LevelMeter } from "@/components/charts/LevelMeter";

interface LearningCardTag {
  label: string;
  icon?: ReactNode;
  variant?: "green" | "blue";
}

interface LearningCardProps {
  title: string;
  currentLevel: number;
  targetLevel: number;
  levelLabel: string;
  description?: ReactNode;
  tag?: LearningCardTag;
  module?: string;
  onClick?: () => void;
  rightIcon?: ReactNode;
  meterVariant?: "green" | "blue";
  className?: string;
}

const TAG_STYLES = {
  green: {
    background: "color-mix(in srgb, var(--accent) 10%, transparent)",
    color: "var(--accent)",
    border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
  },
  blue: {
    background: "var(--tag-surface)",
    color: "var(--funnel-bar-blue)",
    border: "1px solid var(--funnel-bar-blue-30)",
  },
} as const;

export function LearningCard({
  title,
  currentLevel,
  targetLevel,
  levelLabel,
  description,
  tag,
  module,
  onClick,
  rightIcon,
  meterVariant = "blue",
  className,
}: LearningCardProps) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      {...(onClick ? { onClick } : {})}
      className={`rounded-2xl p-4 flex flex-col gap-4 w-full text-left no-lightboard bg-[var(--surface-elevated)] ${onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""} ${className ?? ""}`}
    >
      {tag && (
        <div
          className="inline-flex items-center gap-1 self-start rounded-[14px] px-2 py-1 text-xs leading-4"
          style={TAG_STYLES[tag.variant ?? "blue"]}
        >
          {tag.icon}
          <span>{tag.label}</span>
        </div>
      )}

      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center justify-between">
          <h3 className="text-[var(--text-zinc-100)] text-base font-bold leading-6">{title}</h3>
          {rightIcon}
        </div>

        <LevelMeter current={currentLevel} target={targetLevel} variant={meterVariant} />

        <span className="text-white text-sm leading-5">{levelLabel}</span>

        {module && (
          <span className="text-[var(--text-zinc-500)] text-sm leading-5">{module}</span>
        )}
      </div>

      {description && (
        <p className="text-white text-base leading-6">{description}</p>
      )}
    </Wrapper>
  );
}
