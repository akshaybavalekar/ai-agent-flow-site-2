import React from 'react';

const C = 'var(--theme-chart-line)';
const getColor = (opacity: number) => `color-mix(in srgb, var(--theme-chart-line) ${opacity}%, transparent)`;

interface LevelMeterCardProps {
  title?: string;
  label?: string;
  current: number;
  target: number;
  segments?: number;
  subtitle?: string;
}

export const LevelMeterCard: React.FC<LevelMeterCardProps> = ({ 
  title, 
  label, 
  current, 
  target, 
  segments = 5,
  subtitle 
}) => {
  const clampedCurrent = Math.max(0, Math.min(segments, current));
  const clampedTarget = Math.max(0, Math.min(segments, target));

  return (
    <div className="flex flex-col h-full justify-center gap-3">
      {title && (
        <h3 className="font-data text-base font-bold uppercase tracking-[0.12em]" style={{ color: getColor(90) }}>
          {title}
        </h3>
      )}
      
      <div className="flex flex-col gap-2">
        {label && (
          <div className="flex justify-between items-center">
            <span className="font-voice text-sm" style={{ color: getColor(80) }}>
              {label}
            </span>
            <span className="font-data text-sm font-semibold" style={{ color: C }}>
              {clampedCurrent}/{segments}
            </span>
          </div>
        )}
        
        <div className="flex w-full gap-1">
          {Array.from({ length: segments }, (_, i) => {
            const isFilled = i < clampedCurrent;
            const isTarget = !isFilled && i < clampedTarget;
            return (
              <div
                key={i}
                className="flex-1 h-2 rounded-full"
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
      </div>

      {subtitle && (
        <p className="font-voice text-sm leading-relaxed" style={{ color: getColor(70) }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default LevelMeterCard;