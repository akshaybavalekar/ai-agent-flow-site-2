import React from 'react';

const C = 'var(--theme-chart-line)';
const getColor = (opacity: number) => `color-mix(in srgb, var(--theme-chart-line) ${opacity}%, transparent)`;

interface TrendPoint {
  month: string;
  score: number;
}

interface TrendLineCardProps {
  title?: string;
  data: TrendPoint[];
  height?: number;
  showLabels?: boolean;
  subtitle?: string;
}

export const TrendLineCard: React.FC<TrendLineCardProps> = ({
  title,
  data,
  height = 60,
  showLabels = false,
  subtitle
}) => {
  if (data.length < 2) {
    return (
      <div className="flex flex-col h-full justify-center items-center gap-3">
        {title && (
          <h3 className="font-data text-base font-bold uppercase tracking-[0.12em]" style={{ color: getColor(90) }}>
            {title}
          </h3>
        )}
        <p className="font-voice text-sm" style={{ color: getColor(60) }}>
          Insufficient data for trend
        </p>
      </div>
    );
  }

  const scores = data.map((d) => d.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;

  const width = 200;
  const padY = 6;
  const chartH = height - padY * 2;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = padY + chartH - ((d.score - min) / range) * chartH;
    return `${x},${y}`;
  });

  const gradId = `trend-fill-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className="flex flex-col h-full justify-center gap-3">
      {title && (
        <h3 className="font-data text-base font-bold uppercase tracking-[0.12em]" style={{ color: getColor(90) }}>
          {title}
        </h3>
      )}

      <div className="flex flex-col gap-1 flex-1 justify-center">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="w-full"
          style={{ height }}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C} stopOpacity={0.25} />
              <stop offset="100%" stopColor={C} stopOpacity={0} />
            </linearGradient>
          </defs>
          <polygon
            points={`0,${height} ${points.join(" ")} ${width},${height}`}
            fill={`url(#${gradId})`}
          />
          <polyline
            points={points.join(" ")}
            fill="none"
            stroke={C}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {showLabels && (
          <div className="flex justify-between px-0.5">
            {data.map((d) => (
              <span key={d.month} className="text-[10px] font-data" style={{ color: getColor(60) }}>
                {d.month}
              </span>
            ))}
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

export default TrendLineCard;