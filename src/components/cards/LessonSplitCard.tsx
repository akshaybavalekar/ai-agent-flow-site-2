import React from 'react';
import { Lightbulb } from 'lucide-react';
import { clampList } from '@/utils/clampList';
import { OverflowPill } from './OverflowPill';

const C = 'var(--theme-chart-line)';
const getColor = (o: number) => `color-mix(in srgb, var(--theme-chart-line) ${o}%, transparent)`;

interface LessonSplitCardProps {
    title: string;
    content: string;
    bulletPoints?: string[];
    badge?: string;
    actionText?: string;
}

export const LessonSplitCard: React.FC<LessonSplitCardProps> = ({
    title,
    content,
    bulletPoints = [],
    badge,
    actionText,
}) => {
    const { visible, overflow } = clampList(bulletPoints, 5);

    return (
        <div className="flex flex-col h-full overflow-hidden gap-3">
            {/* Badge */}
            {badge && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-data text-xs uppercase tracking-wider w-fit shrink-0"
                    style={{ backgroundColor: getColor(12), color: C, border: `1px solid ${getColor(25)}` }}>
                    <Lightbulb size={10} />{badge}
                </span>
            )}

            {/* Title */}
            <h3 className="font-data text-base font-bold uppercase tracking-[0.12em] shrink-0" style={{ color: C }}>{title}</h3>

            {/* Content */}
            <p className="font-voice text-base leading-relaxed shrink-0" style={{ color: getColor(75) }}>{content}</p>

            {/* Bullet points */}
            {visible.length > 0 && (
                <div className="flex-1 flex flex-col gap-1.5 min-h-0 overflow-hidden">
                    {visible.map((point, i) => (
                        <div key={i} className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center font-data text-xs font-bold shrink-0 mt-0.5"
                                style={{ backgroundColor: getColor(15), color: C }}>
                                {i + 1}
                            </div>
                            <span className="font-voice text-base leading-snug" style={{ color: getColor(78) }}>{point}</span>
                        </div>
                    ))}
                    <OverflowPill count={overflow} label="more" />
                </div>
            )}

            {/* Action */}
            {actionText && (
                <div className="shrink-0 font-data text-base uppercase tracking-wider text-right"
                    style={{ color: getColor(55) }}>→ {actionText}
                </div>
            )}
        </div>
    );
};

export default LessonSplitCard;
