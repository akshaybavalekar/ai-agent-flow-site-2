import React from 'react';
import { CheckCircle, Lock, Clock, Trophy } from 'lucide-react';
import { clampList } from '@/utils/clampList';
import { OverflowPill } from './OverflowPill';

const C = 'var(--theme-chart-line)';
const getColor = (o: number) => `color-mix(in srgb, var(--theme-chart-line) ${o}%, transparent)`;

const STATUS_ICON: Record<string, React.ReactNode> = {
    completed:   <CheckCircle size={14} />,
    'in-progress': <Clock size={14} />,
    locked:      <Lock size={14} />,
};
const STATUS_COLOR: Record<string, string> = {
    completed:   '#22c55e',
    'in-progress': C,
    locked:      'var(--theme-card-data)',
};

interface Module {
    title: string;
    duration?: string;
    status: 'completed' | 'in-progress' | 'locked';
    description?: string;
}

interface LearningPathCardProps {
    title?: string;
    subtitle?: string;
    targetJob?: string;
    totalDuration?: string;
    modules: Module[];
    overallProgress?: number;
}

export const LearningPathCard: React.FC<LearningPathCardProps> = ({
    title,
    subtitle,
    targetJob,
    totalDuration,
    modules = [],
    overallProgress,
}) => {
    const { visible, overflow } = clampList(modules, 4);
    const completed = modules.filter(m => m.status === 'completed').length;

    return (
        <div className="flex flex-col h-full overflow-hidden gap-3">
            {/* Header */}
            <div className="shrink-0">
                {title && <h3 className="font-data text-base uppercase tracking-[0.12em]" style={{ color: getColor(90) }}>{title}</h3>}
                {subtitle && <p className="font-voice text-base leading-tight mt-0.5" style={{ color: getColor(65) }}>{subtitle}</p>}
                {targetJob && (
                    <div className="flex items-center gap-1.5 mt-1">
                        <Trophy size={12} style={{ color: C }} />
                        <span className="font-data text-base uppercase tracking-wider" style={{ color: C }}>{targetJob}</span>
                    </div>
                )}
            </div>

            {/* Progress bar */}
            {overallProgress !== undefined && (
                <div className="shrink-0">
                    <div className="flex justify-between mb-1">
                        <span className="font-data text-base uppercase tracking-wider" style={{ color: getColor(65) }}>
                            {completed}/{modules.length} modules
                        </span>
                        <span className="font-data text-base font-bold" style={{ color: C }}>{overallProgress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: getColor(15) }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${overallProgress}%`, backgroundColor: C }} />
                    </div>
                </div>
            )}

            {/* Modules */}
            <div className="flex-1 flex flex-col gap-1.5 min-h-0 overflow-hidden">
                {visible.map((mod, i) => {
                    const sColor = STATUS_COLOR[mod.status] ?? getColor(60);
                    return (
                        <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded"
                            style={{
                                backgroundColor: mod.status === 'in-progress' ? getColor(8) : getColor(4),
                                border: `1px solid ${mod.status === 'in-progress' ? getColor(20) : getColor(10)}`,
                            }}>
                            <span className="shrink-0 mt-0.5" style={{ color: sColor }}>{STATUS_ICON[mod.status]}</span>
                            <div className="min-w-0 flex-1">
                                <div className="font-data text-base leading-tight" style={{ color: mod.status === 'locked' ? getColor(45) : getColor(88) }}>
                                    {mod.title}
                                </div>
                                {mod.description && (
                                    <div className="font-voice text-base leading-tight mt-0.5 line-clamp-1" style={{ color: getColor(55) }}>{mod.description}</div>
                                )}
                            </div>
                            {mod.duration && (
                                <span className="font-data text-xs shrink-0" style={{ color: getColor(50) }}>{mod.duration}</span>
                            )}
                        </div>
                    );
                })}
            </div>
            <OverflowPill count={overflow} label="more modules" />

            {totalDuration && (
                <div className="font-data text-base uppercase tracking-wider text-right shrink-0" style={{ color: getColor(55) }}>
                    Total: {totalDuration}
                </div>
            )}
        </div>
    );
};

export default LearningPathCard;
