import React from 'react';
import { Trophy, TrendingUp } from 'lucide-react';

const C = 'var(--theme-chart-line)';
const getColor = (o: number) => `color-mix(in srgb, var(--theme-chart-line) ${o}%, transparent)`;

interface Stat {
    label: string;
    value: string;
    improvement?: string;
}

interface MilestoneCardProps {
    title?: string;
    milestone: string;
    subtitle?: string;
    stats?: Stat[];
    encouragement?: string;
    nextMilestone?: string;
}

export const MilestoneCard: React.FC<MilestoneCardProps> = ({
    title,
    milestone,
    subtitle,
    stats = [],
    encouragement,
    nextMilestone,
}) => (
    <div className="flex flex-col h-full overflow-hidden gap-3 p-1">
        {/* Milestone badge */}
        <div className="flex flex-col items-center text-center shrink-0 gap-1">
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: getColor(12), border: `2px solid ${getColor(30)}` }}>
                <Trophy size={22} style={{ color: C }} />
            </div>
            {title && <h3 className="font-data text-base uppercase tracking-[0.12em]" style={{ color: getColor(90) }}>{title}</h3>}
            <div className="font-data text-base font-bold" style={{ color: C }}>{milestone}</div>
            {subtitle && <p className="font-voice text-base leading-tight" style={{ color: getColor(65) }}>{subtitle}</p>}
        </div>

        {/* Stats grid */}
        {stats.length > 0 && (
            <div className="grid grid-cols-2 gap-2 shrink-0">
                {stats.map((s, i) => (
                    <div key={i} className="flex flex-col items-center p-2 rounded-lg gap-0.5"
                        style={{ backgroundColor: getColor(6), border: `1px solid ${getColor(12)}` }}>
                        <span className="font-data text-base font-bold" style={{ color: C }}>{s.value}</span>
                        <span className="font-data text-xs uppercase tracking-wider text-center" style={{ color: getColor(55) }}>{s.label}</span>
                        {s.improvement && (
                            <span className="flex items-center gap-0.5 font-data text-xs" style={{ color: '#22c55e' }}>
                                <TrendingUp size={10} />{s.improvement}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        )}

        {/* Encouragement */}
        {encouragement && (
            <div className="flex-1 flex items-center justify-center px-3 py-2 rounded"
                style={{ backgroundColor: getColor(6), border: `1px solid ${getColor(12)}` }}>
                <p className="font-voice text-base leading-relaxed text-center italic" style={{ color: getColor(75) }}>
                    "{encouragement}"
                </p>
            </div>
        )}

        {/* Next milestone */}
        {nextMilestone && (
            <div className="shrink-0 font-data text-base uppercase tracking-wider text-center" style={{ color: getColor(50) }}>
                Next: {nextMilestone}
            </div>
        )}
    </div>
);

export default MilestoneCard;
