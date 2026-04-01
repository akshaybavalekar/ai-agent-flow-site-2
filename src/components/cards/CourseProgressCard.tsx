import React from 'react';
import { Trophy, CheckCircle, Circle } from 'lucide-react';
import { clampList } from '@/utils/clampList';
import { OverflowPill } from './OverflowPill';

const C = 'var(--theme-chart-line)';
const getColor = (o: number) => `color-mix(in srgb, var(--theme-chart-line) ${o}%, transparent)`;

interface DomainProgress {
    domainNumber: number;
    domainTitle: string;
    weight: number;
    tasksCompleted: number;
    totalTasks: number;
    questionsCorrect?: number;
    totalQuestions?: number;
}

interface CourseProgressCardProps {
    title?: string;
    courseTitle: string;
    domains: DomainProgress[];
    overallScore?: number;
    readyForExam?: boolean;
}

export const CourseProgressCard: React.FC<CourseProgressCardProps> = ({
    title,
    courseTitle,
    domains = [],
    overallScore,
    readyForExam,
}) => {
    const { visible, overflow } = clampList(domains, 4);
    const totalWeight = domains.reduce((s, d) => {
        const domPct = d.totalTasks > 0 ? d.tasksCompleted / d.totalTasks : 0;
        return s + domPct * d.weight;
    }, 0);
    const overallPct = Math.round(totalWeight);

    return (
        <div className="flex flex-col h-full overflow-hidden gap-3">
            {/* Header */}
            <div className="flex items-start justify-between shrink-0">
                <div>
                    {title && <h3 className="font-data text-base uppercase tracking-[0.12em]" style={{ color: getColor(90) }}>{title}</h3>}
                    <div className="font-data text-base font-bold mt-0.5" style={{ color: C }}>{courseTitle}</div>
                </div>
                {readyForExam && (
                    <span className="font-data text-xs uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
                        style={{ backgroundColor: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e44' }}>
                        Ready
                    </span>
                )}
            </div>

            {/* Overall progress */}
            <div className="shrink-0">
                <div className="flex justify-between mb-1">
                    <span className="font-data text-base uppercase tracking-wider" style={{ color: getColor(60) }}>Overall Progress</span>
                    <div className="flex items-center gap-1.5">
                        <Trophy size={12} style={{ color: C }} />
                        <span className="font-data text-base font-bold" style={{ color: C }}>
                            {overallScore !== undefined ? `${overallScore}%` : `${overallPct}%`}
                        </span>
                    </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: getColor(15) }}>
                    <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${overallScore ?? overallPct}%`, backgroundColor: C }} />
                </div>
            </div>

            {/* Domains */}
            <div className="flex-1 flex flex-col gap-1.5 min-h-0 overflow-hidden">
                {visible.map((d, i) => {
                    const pct = d.totalTasks > 0 ? Math.round((d.tasksCompleted / d.totalTasks) * 100) : 0;
                    return (
                        <div key={i} className="flex flex-col gap-1 px-2 py-1.5 rounded"
                            style={{ backgroundColor: getColor(5), border: `1px solid ${getColor(10)}` }}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <span className="shrink-0" style={{ color: pct === 100 ? '#22c55e' : getColor(40) }}>
                                        {pct === 100 ? <CheckCircle size={12} /> : <Circle size={12} />}
                                    </span>
                                    <span className="font-data text-base leading-tight" style={{ color: getColor(85) }}>
                                        D{d.domainNumber} · {d.domainTitle}
                                    </span>
                                </div>
                                <span className="font-data text-xs shrink-0 ml-2" style={{ color: getColor(55) }}>
                                    {d.tasksCompleted}/{d.totalTasks} · {d.weight}%
                                </span>
                            </div>
                            <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: getColor(12) }}>
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: C }} />
                            </div>
                        </div>
                    );
                })}
            </div>
            <OverflowPill count={overflow} label="more domains" />
        </div>
    );
};

export default CourseProgressCard;
