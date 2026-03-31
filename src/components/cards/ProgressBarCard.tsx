import React from 'react';

const C = 'var(--theme-chart-line)';
const getColor = (opacity: number) => `color-mix(in srgb, var(--theme-chart-line) ${opacity}%, transparent)`;

interface ProgressBarCardProps {
  title?: string;
  label?: string;
  percent: number;
  subtitle?: string;
  showPercentage?: boolean;
}

export const ProgressBarCard: React.FC<ProgressBarCardProps> = ({ 
  title, 
  label, 
  percent, 
  subtitle,
  showPercentage = true 
}) => {
  const clampedPercent = Math.max(0, Math.min(100, percent));

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
            {showPercentage && (
              <span className="font-data text-sm font-semibold" style={{ color: C }}>
                {clampedPercent}%
              </span>
            )}
          </div>
        )}
        
        <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: getColor(12) }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${clampedPercent}%`, 
              backgroundColor: C 
            }}
          />
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

export default ProgressBarCard;