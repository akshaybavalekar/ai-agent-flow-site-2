import React from 'react';
import { ChevronUp } from 'lucide-react';

const C = 'var(--theme-chart-line)';
const getColor = (opacity: number) => `color-mix(in srgb, var(--theme-chart-line) ${opacity}%, transparent)`;

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 251.33

const ACCENT_STROKE: Record<"green" | "amber" | "red", string> = {
  green: "#4ade80",
  amber: "#f59e0b", 
  red: "#f87171",
};

interface CircularGaugeCardProps {
  title?: string;
  percentage?: number;
  size?: number;
  accent?: "green" | "amber" | "red";
  subtitle?: string;
}

export const CircularGaugeCard: React.FC<CircularGaugeCardProps> = ({ 
  title, 
  percentage, 
  size = 98, 
  accent,
  subtitle 
}) => {
  const isVelocity = percentage === undefined;
  const color = isVelocity
    ? "#4ade80"
    : accent
      ? ACCENT_STROKE[accent]
      : percentage >= 75
        ? "#4ade80"
        : "#f59e0b";
  const dashOffset = isVelocity
    ? 0
    : CIRCUMFERENCE * (1 - percentage / 100);

  return (
    <div className="flex flex-col h-full justify-center items-center gap-4 text-center">
      {title && (
        <h3 className="font-data text-base font-bold uppercase tracking-[0.12em]" style={{ color: getColor(90) }}>
          {title}
        </h3>
      )}
      
      <div
        data-testid="circular-gauge"
        className="relative flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        {/* SVG ring */}
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className="absolute inset-0"
          aria-hidden="true"
        >
          {/* Track — always full dark ring */}
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke={getColor(15)}
            strokeWidth="10"
          />
          {/* Coloured progress arc (or full ring for velocity) */}
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap={isVelocity ? undefined : "round"}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 50 50)"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>

        {/* Center content */}
        <div className="relative z-10 flex items-center justify-center">
          {isVelocity ? (
            /* 3 stacked upward chevrons — Career Velocity indicator */
            <div className="flex flex-col items-center" style={{ gap: -4 }}>
              <ChevronUp size={13} style={{ color: getColor(50) }} />
              <ChevronUp size={13} style={{ color: getColor(75) }} />
              <ChevronUp size={13} style={{ color: getColor(90) }} />
            </div>
          ) : (
            <span
              className="font-data font-bold leading-none"
              style={{ fontSize: 18, color: getColor(90) }}
            >
              {percentage}%
            </span>
          )}
        </div>
      </div>

      {subtitle && (
        <p className="font-voice text-sm leading-relaxed" style={{ color: getColor(70) }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default CircularGaugeCard;