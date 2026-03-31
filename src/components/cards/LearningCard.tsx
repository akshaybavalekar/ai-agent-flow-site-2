import React from 'react';
import { BookOpen, Play, FileText } from 'lucide-react';

const C = 'var(--theme-chart-line)';
const getColor = (opacity: number) => `color-mix(in srgb, var(--theme-chart-line) ${opacity}%, transparent)`;

interface LearningCardProps {
  title?: string;
  courseTitle: string;
  currentLevel: number;
  targetLevel: number;
  levelLabel: string;
  description?: string;
  module?: string;
  courseType?: 'video' | 'reading' | 'hands-on';
  progress?: number;
  duration?: string;
}

const TYPE_ICONS = {
  video: Play,
  reading: FileText,
  'hands-on': BookOpen,
};

const TYPE_COLORS = {
  video: '#4ade80',
  reading: '#60a5fa', 
  'hands-on': '#c084fc',
};

export const LearningCard: React.FC<LearningCardProps> = ({
  title,
  courseTitle,
  currentLevel,
  targetLevel,
  levelLabel,
  description,
  module,
  courseType = 'reading',
  progress = 0,
  duration
}) => {
  const segments = 5;
  const Icon = TYPE_ICONS[courseType];
  const typeColor = TYPE_COLORS[courseType];

  return (
    <div className="flex flex-col h-full justify-start gap-3">
      {title && (
        <h3 className="font-data text-base font-bold uppercase tracking-[0.12em]" style={{ color: getColor(90) }}>
          {title}
        </h3>
      )}

      {/* Type tag */}
      <div
        className="inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-xs"
        style={{
          backgroundColor: `color-mix(in srgb, ${typeColor} 15%, transparent)`,
          border: `1px solid color-mix(in srgb, ${typeColor} 30%, transparent)`,
          color: typeColor
        }}
      >
        <Icon size={12} />
        <span className="font-data uppercase tracking-wider">{courseType}</span>
      </div>

      {/* Course title and level meter */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-voice text-base font-bold leading-tight flex-1" style={{ color: getColor(90) }}>
            {courseTitle}
          </h4>
          {duration && (
            <span className="font-data text-xs shrink-0" style={{ color: getColor(60) }}>
              {duration}
            </span>
          )}
        </div>

        {/* Level meter */}
        <div className="flex w-full gap-1">
          {Array.from({ length: segments }, (_, i) => {
            const isFilled = i < currentLevel;
            const isTarget = !isFilled && i < targetLevel;
            return (
              <div
                key={i}
                className="flex-1 h-1.5 rounded-full"
                style={{
                  backgroundColor: isFilled 
                    ? C 
                    : isTarget 
                      ? getColor(30)
                      : getColor(12),
                  border: isTarget ? `1px solid ${getColor(50)}` : 'none'
                }}
              />
            );
          })}
        </div>

        <span className="font-voice text-sm" style={{ color: getColor(80) }}>
          {levelLabel}
        </span>

        {module && (
          <span className="font-voice text-sm" style={{ color: getColor(60) }}>
            {module}
          </span>
        )}
      </div>

      {/* Progress bar if provided */}
      {progress > 0 && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="font-data text-xs" style={{ color: getColor(70) }}>
              PROGRESS
            </span>
            <span className="font-data text-xs" style={{ color: C }}>
              {progress}%
            </span>
          </div>
          <div className="h-1 rounded-full" style={{ backgroundColor: getColor(12) }}>
            <div
              className="h-full rounded-full"
              style={{ 
                width: `${progress}%`, 
                backgroundColor: C 
              }}
            />
          </div>
        </div>
      )}

      {/* Description */}
      {description && (
        <p className="font-voice text-sm leading-relaxed flex-1" style={{ color: getColor(70) }}>
          {description}
        </p>
      )}
    </div>
  );
};

export default LearningCard;