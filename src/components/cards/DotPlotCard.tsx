import React from 'react';

const C = 'var(--theme-chart-line)';
const getColor = (opacity: number) => `color-mix(in srgb, var(--theme-chart-line) ${opacity}%, transparent)`;

const MAX_DOTS = 10;

interface DotPlotItem {
  label: string;
  filled: number;
  target?: number;
  value?: number | string;
}

interface DotPlotCardProps {
  title?: string;
  items: DotPlotItem[];
  total?: number;
  subtitle?: string;
}

export const DotPlotCard: React.FC<DotPlotCardProps> = ({
  title,
  items,
  total = MAX_DOTS,
  subtitle
}) => {
  return (
    <div className="flex flex-col h-full justify-start gap-3">
      {title && (
        <h3 className="font-data text-base font-bold uppercase tracking-[0.12em]" style={{ color: getColor(90) }}>
          {title}
        </h3>
      )}

      <div className="flex flex-col gap-3 flex-1">
        {items.map((item, index) => {
          const f = Math.min(Math.max(0, item.filled), total);
          const t = Math.min(Math.max(0, item.target || 0), total - f);
          const e = total - f - t;

          return (
            <div key={index} className="flex items-center justify-between">
              <span className="font-voice text-sm flex-1 min-w-0 truncate pr-3" style={{ color: getColor(80) }}>
                {item.label}
              </span>
              <div className="flex gap-1 items-center shrink-0">
                <div className="flex gap-1 items-center">
                  {Array.from({ length: f }, (_, i) => (
                    <div
                      key={`f-${i}`}
                      className="w-2 h-5 rounded-full"
                      style={{ backgroundColor: C }}
                    />
                  ))}
                  {Array.from({ length: t }, (_, i) => (
                    <div
                      key={`t-${i}`}
                      className="w-2 h-5 rounded-full border"
                      style={{ 
                        backgroundColor: getColor(20),
                        borderColor: C
                      }}
                    />
                  ))}
                  {Array.from({ length: e }, (_, i) => (
                    <div
                      key={`e-${i}`}
                      className="w-2 h-5 rounded-full"
                      style={{ backgroundColor: getColor(15) }}
                    />
                  ))}
                </div>
                {item.value !== undefined && (
                  <span className="font-data text-sm font-semibold text-center w-5 ml-2" style={{ color: getColor(70) }}>
                    {item.value}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {subtitle && (
        <p className="font-voice text-sm leading-relaxed" style={{ color: getColor(70) }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default DotPlotCard;