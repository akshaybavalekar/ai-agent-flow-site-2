import React from 'react';
import { PartyPopper, Award, Rocket, CheckCircle } from 'lucide-react';

const C = 'var(--theme-chart-line)';
const getColor = (o: number) => `color-mix(in srgb, var(--theme-chart-line) ${o}%, transparent)`;

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
    certification: { icon: <Award size={28} />,       color: '#eab308' },
    milestone:     { icon: <Rocket size={28} />,      color: C },
    completion:    { icon: <CheckCircle size={28} />, color: '#22c55e' },
    general:       { icon: <PartyPopper size={28} />, color: C },
};

interface Detail { label: string; value: string; }

interface CelebrationCardProps {
    title?: string;
    type?: string;
    subtitle?: string;
    details?: Detail[];
    nextSteps?: string[];
}

export const CelebrationCard: React.FC<CelebrationCardProps> = ({
    title,
    type = 'general',
    subtitle,
    details = [],
    nextSteps = [],
}) => {
    const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.general;

    return (
        <div className="flex flex-col h-full overflow-hidden gap-3 p-1">
            {/* Icon + title */}
            <div className="flex flex-col items-center text-center gap-2 shrink-0">
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${cfg.color}18`, border: `2px solid ${cfg.color}44` }}>
                    <span style={{ color: cfg.color }}>{cfg.icon}</span>
                </div>
                {title && <div className="font-data text-base font-bold uppercase tracking-[0.12em]" style={{ color: C }}>{title}</div>}
                {subtitle && <p className="font-voice text-base leading-relaxed" style={{ color: getColor(70) }}>{subtitle}</p>}
            </div>

            {/* Details */}
            {details.length > 0 && (
                <div className="px-3 py-2 rounded shrink-0"
                    style={{ backgroundColor: getColor(6), border: `1px solid ${getColor(12)}` }}>
                    {details.map((d, i) => (
                        <div key={i} className="flex justify-between items-center py-0.5">
                            <span className="font-data text-base uppercase tracking-wider" style={{ color: getColor(60) }}>{d.label}</span>
                            <span className="font-data text-base font-bold" style={{ color: getColor(88) }}>{d.value}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Next steps */}
            {nextSteps.length > 0 && (
                <div className="flex-1 flex flex-col gap-1.5 min-h-0 overflow-hidden">
                    <div className="font-data text-base uppercase tracking-wider shrink-0" style={{ color: getColor(60) }}>What's next</div>
                    {nextSteps.slice(0, 4).map((step, i) => (
                        <div key={i} className="flex items-start gap-2">
                            <CheckCircle size={12} style={{ color: C, marginTop: 3, flexShrink: 0 }} />
                            <span className="font-voice text-base leading-snug" style={{ color: getColor(75) }}>{step}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CelebrationCard;
