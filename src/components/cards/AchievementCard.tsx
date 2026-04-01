import React from 'react';
import { Trophy, Sparkles } from 'lucide-react';

const C = 'var(--theme-chart-line)';
const getColor = (o: number) => `color-mix(in srgb, var(--theme-chart-line) ${o}%, transparent)`;

const BADGE_STYLE: Record<string, { color: string; glow: string }> = {
    gold:    { color: '#eab308', glow: '0 0 24px rgba(234,179,8,0.35)' },
    silver:  { color: '#9ca3af', glow: '0 0 24px rgba(156,163,175,0.3)' },
    bronze:  { color: '#ea580c', glow: '0 0 24px rgba(234,88,12,0.3)' },
    special: { color: C,         glow: `0 0 24px ${getColor(35)}` },
};

interface Stat {
    label: string;
    value: string;
}

interface AchievementCardProps {
    title?: string;
    achievementTitle: string;
    description?: string;
    badge?: 'gold' | 'silver' | 'bronze' | 'special';
    date?: string;
    message?: string;
    stats?: Stat[];
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
    title = 'Achievement Unlocked!',
    achievementTitle,
    description,
    badge = 'special',
    date,
    message,
    stats = [],
}) => {
    const bs = BADGE_STYLE[badge] ?? BADGE_STYLE.special;

    return (
        <div className="flex flex-col h-full overflow-hidden gap-3 p-1">
            {/* Header sparkle */}
            <div className="flex items-center justify-center gap-1.5 shrink-0">
                <Sparkles size={12} style={{ color: '#eab308' }} />
                <span className="font-data text-xs uppercase tracking-widest" style={{ color: '#eab308' }}>{title}</span>
                <Sparkles size={12} style={{ color: '#eab308' }} />
            </div>

            {/* Trophy */}
            <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                        backgroundColor: `${bs.color}18`,
                        border: `2px solid ${bs.color}55`,
                        boxShadow: bs.glow,
                    }}>
                    <Trophy size={28} style={{ color: bs.color }} />
                </div>
                <div className="text-center">
                    <div className="font-data text-base font-bold" style={{ color: getColor(95) }}>{achievementTitle}</div>
                    {description && <p className="font-voice text-base mt-0.5" style={{ color: getColor(65) }}>{description}</p>}
                    {date && <p className="font-data text-xs uppercase tracking-wider mt-0.5" style={{ color: getColor(45) }}>Earned {date}</p>}
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className="px-3 py-2 rounded text-center"
                    style={{ backgroundColor: getColor(6), border: `1px solid ${getColor(12)}` }}>
                    <p className="font-voice text-base italic leading-relaxed" style={{ color: getColor(72) }}>"{message}"</p>
                </div>
            )}

            {/* Stats */}
            {stats.length > 0 && (
                <div className="grid grid-cols-2 gap-2 shrink-0 mt-auto">
                    {stats.map((s, i) => (
                        <div key={i} className="flex flex-col items-center p-2 rounded"
                            style={{ backgroundColor: getColor(6), border: `1px solid ${getColor(12)}` }}>
                            <span className="font-data text-base font-bold" style={{ color: C }}>{s.value}</span>
                            <span className="font-data text-xs uppercase tracking-wider text-center" style={{ color: getColor(55) }}>{s.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AchievementCard;
