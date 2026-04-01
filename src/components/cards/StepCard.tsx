import React from 'react';
import { ListOrdered, CheckCircle } from 'lucide-react';
import { clampList } from '@/utils/clampList';
import { OverflowPill } from './OverflowPill';

const C = 'var(--theme-chart-line)';
const getColor = (o: number) => `color-mix(in srgb, var(--theme-chart-line) ${o}%, transparent)`;

interface Step {
    stepNumber: number;
    title: string;
    description: string;
    completed?: boolean;
}

interface StepCardProps {
    title?: string;
    subtitle?: string;
    steps: Step[];
    currentStep?: number;
    showProgress?: boolean;
}

export const StepCard: React.FC<StepCardProps> = ({
    title,
    subtitle,
    steps = [],
    currentStep = 0,
    showProgress = true,
}) => {
    const { visible, overflow } = clampList(steps, 5);
    const completed = steps.filter(s => s.completed).length;
    const pct = steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0;

    return (
        <div className="flex flex-col h-full overflow-hidden gap-2">
            {/* Header */}
            <div className="flex items-center gap-2 shrink-0">
                <ListOrdered size={14} style={{ color: C }} />
                <div>
                    {title && <h3 className="font-data text-base uppercase tracking-[0.12em]" style={{ color: getColor(90) }}>{title}</h3>}
                    {subtitle && <p className="font-voice text-base" style={{ color: getColor(60) }}>{subtitle}</p>}
                </div>
                {showProgress && steps.length > 0 && (
                    <div className="ml-auto flex items-center gap-2 shrink-0">
                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: getColor(15) }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: C }} />
                        </div>
                        <span className="font-data text-xs" style={{ color: getColor(55) }}>{completed}/{steps.length}</span>
                    </div>
                )}
            </div>

            {/* Steps */}
            <div className="flex-1 flex flex-col gap-1.5 min-h-0 overflow-hidden">
                {visible.map((step, i) => {
                    const isActive = i === currentStep;
                    const isDone = step.completed;
                    return (
                        <div key={i} className="flex gap-2 px-2 py-1.5 rounded transition-all"
                            style={{
                                backgroundColor: isActive ? getColor(10) : isDone ? getColor(5) : getColor(4),
                                border: `1px solid ${isActive ? getColor(25) : isDone ? getColor(15) : getColor(10)}`,
                            }}>
                            {/* Step number / check */}
                            <div className="w-6 h-6 rounded-full flex items-center justify-center font-data text-xs font-bold shrink-0 mt-0.5"
                                style={{
                                    backgroundColor: isDone ? '#22c55e22' : isActive ? getColor(20) : getColor(10),
                                    color: isDone ? '#22c55e' : isActive ? C : getColor(50),
                                }}>
                                {isDone ? <CheckCircle size={12} /> : step.stepNumber}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="font-data text-base leading-tight"
                                    style={{ color: isDone ? '#22c55e' : isActive ? getColor(92) : getColor(70) }}>
                                    {step.title}
                                </div>
                                <div className="font-voice text-base leading-snug mt-0.5 line-clamp-2"
                                    style={{ color: getColor(55) }}>
                                    {step.description}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <OverflowPill count={overflow} label="more steps" />
        </div>
    );
};

export default StepCard;
