import React from 'react';
import { CheckCircle, Circle, Target } from 'lucide-react';
import { clampList } from '@/utils/clampList';
import { OverflowPill } from './OverflowPill';

const C = 'var(--theme-chart-line)';
const getColor = (o: number) => `color-mix(in srgb, var(--theme-chart-line) ${o}%, transparent)`;

interface Objective {
    text: string;
    completed?: boolean;
    score?: number;
}

interface ObjectivesCardProps {
    title?: string;
    taskTitle?: string;
    objectives: Objective[];
    showProgress?: boolean;
}

export const ObjectivesCard: React.FC<ObjectivesCardProps> = ({
    title,
    taskTitle,
    objectives = [],
    showProgress = true,
}) => {
    const { visible, overflow } = clampList(objectives, 6);
    const completed = objectives.filter(o => o.completed).length;
    const pct = objectives.length > 0 ? Math.round((completed / objectives.length) * 100) : 0;

    return (
        <div className="flex flex-col h-full overflow-hidden gap-2">
            {/* Header */}
            <div className="shrink-0">
                <div className="flex items-center gap-2">
                    <Target size={14} style={{ color: C }} />
                    {title && <h3 className="font-data text-base uppercase tracking-[0.12em]" style={{ color: getColor(90) }}>{title}</h3>}
                </div>
                {taskTitle && <p className="font-voice text-base mt-0.5" style={{ color: getColor(65) }}>{taskTitle}</p>}
            </div>

            {/* Progress */}
            {showProgress && objectives.length > 0 && (
                <div className="shrink-0">
                    <div className="flex justify-between mb-1">
                        <span className="font-data text-base uppercase tracking-wider" style={{ color: getColor(60) }}>
                            {completed}/{objectives.length} complete
                        </span>
                        <span className="font-data text-base font-bold" style={{ color: C }}>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: getColor(15) }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: C }} />
                    </div>
                </div>
            )}

            {/* Objectives */}
            <div className="flex-1 flex flex-col gap-1.5 min-h-0 overflow-hidden">
                {visible.map((obj, i) => (
                    <div key={i} className="flex items-start gap-2 py-1">
                        <span className="shrink-0 mt-0.5" style={{ color: obj.completed ? '#22c55e' : getColor(40) }}>
                            {obj.completed ? <CheckCircle size={14} /> : <Circle size={14} />}
                        </span>
                        <div className="flex-1 min-w-0">
                            <span className="font-voice text-base leading-snug"
                                style={{
                                    color: obj.completed ? getColor(55) : getColor(85),
                                    textDecoration: obj.completed ? 'line-through' : 'none',
                                }}>
                                {obj.text}
                            </span>
                            {obj.score !== undefined && (
                                <div className="mt-0.5">
                                    <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: getColor(12) }}>
                                        <div className="h-full rounded-full" style={{ width: `${obj.score}%`, backgroundColor: C }} />
                                    </div>
                                </div>
                            )}
                        </div>
                        {obj.score !== undefined && (
                            <span className="font-data text-xs shrink-0" style={{ color: C }}>{obj.score}%</span>
                        )}
                    </div>
                ))}
            </div>
            <OverflowPill count={overflow} label="more objectives" />
        </div>
    );
};

export default ObjectivesCard;
