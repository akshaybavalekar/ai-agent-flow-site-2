import React from 'react';
import { TrendingUp } from 'lucide-react';

const C = 'var(--theme-chart-line)';
const getColor = (opacity: number) => `color-mix(in srgb, var(--theme-chart-line) ${opacity}%, transparent)`;

interface PathStop {
  label: string;
  status: "completed" | "current" | "upcoming";
}

interface PathTrackCardProps {
  title?: string;
  label?: string;
  fromLabel?: string;
  toLabel?: string;
  percentage: number;
  stops?: PathStop[];
  subtitle?: string;
}

export const PathTrackCard: React.FC<PathTrackCardProps> = ({
  title,
  label = "Career Path",
  fromLabel = "Current",
  toLabel,
  percentage,
  stops,
  subtitle
}) => {
  const progress = Math.min(100, Math.max(0, percentage));

  return (
    <div className="flex flex-col h-full justify-center gap-4">
      {title && (
        <h3 className="font-data text-base font-bold uppercase tracking-[0.12em]" style={{ color: getColor(90) }}>
          {title}
        </h3>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex gap-2 items-center">
          <TrendingUp size={16} style={{ color: C }} />
          <span className="font-voice text-lg font-semibold" style={{ color: getColor(90) }}>
            {label}
          </span>
        </div>

        {stops ? (
          <div className="flex flex-row">
            <div className="relative flex flex-col items-center w-full">
              <div
                className="absolute inset-y-0 left-0 rounded-full h-[5px] top-[5.5px]"
                style={{ 
                  width: "100%", 
                  backgroundColor: getColor(20) 
                }}
              />
              <div
                className="absolute inset-y-0 left-0 rounded-full h-[5px] top-[5.5px]"
                style={{
                  width: `${percentage}%`,
                  background: `linear-gradient(to right, ${getColor(60)}, ${C})`,
                }}
              />
              <div className="w-full flex flex-row justify-between">
                {stops.map((stop, i) => {
                  const filled = stop.status === "completed" || stop.status === "current";
                  const backgroundColor = filled ? C : getColor(20);
                  const borderColor = filled ? C : getColor(40);
                  
                  return (
                    <div
                      key={stop.label}
                      className="flex flex-col items-center justify-center gap-1"
                    >
                      <div
                        className="size-4 rounded-full border-2"
                        style={{
                          backgroundColor,
                          borderColor
                        }}
                      />
                      <span
                        className="text-xs text-center flex-1 font-voice"
                        style={{
                          color: stop.status === "current"
                            ? C
                            : stop.status === "completed"
                              ? getColor(80)
                              : getColor(60)
                        }}
                      >
                        {stop.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="relative h-1 rounded-full" style={{ backgroundColor: getColor(20) }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(to right, ${getColor(60)}, ${C})`,
                }}
              />
            </div>
            <div className="flex justify-between">
              <span className="font-voice text-xs" style={{ color: getColor(80) }}>
                {fromLabel}
              </span>
              {toLabel && (
                <span className="font-voice text-xs font-medium" style={{ color: C }}>
                  {toLabel}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {subtitle && (
        <p className="font-voice text-sm leading-relaxed" style={{ color: getColor(70) }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default PathTrackCard;