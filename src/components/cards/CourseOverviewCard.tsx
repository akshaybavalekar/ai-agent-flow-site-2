import React from 'react';
import { BookOpen, Clock, Target, Award } from 'lucide-react';
import { clampList } from '@/utils/clampList';
import { OverflowPill } from './OverflowPill';

const C = 'var(--theme-chart-line)';
const getColor = (o: number) => `color-mix(in srgb, var(--theme-chart-line) ${o}%, transparent)`;

const DIFFICULTY_COLOR: Record<string, string> = {
    Foundational: '#22c55e',
    Associate:    '#38bdf8',
    Professional: '#a855f7',
    Specialty:    '#f97316',
};

interface Domain {
    number: number;
    title: string;
    weight: number;
    masteryScore?: number;
}

interface CourseOverviewCardProps {
    title?: string;
    courseTitle: string;
    certificationName?: string;
    description?: string;
    domains: Domain[];
    totalQuestions?: number;
    passingScore?: number;
    examDuration?: string;
    difficulty?: string;
    overallMastery?: number;
}

export const CourseOverviewCard: React.FC<CourseOverviewCardProps> = ({
    title,
    courseTitle,
    certificationName,
    description,
    domains = [],
    totalQuestions,
    passingScore,
    examDuration,
    difficulty = 'Foundational',
    overallMastery,
}) => {
    const { visible, overflow } = clampList(domains, 4);
    const diffColor = DIFFICULTY_COLOR[difficulty] ?? C;

    return (
        <div className="flex flex-col h-full overflow-hidden gap-3">
            {title && (
                <h3 className="font-data text-base uppercase tracking-[0.12em] shrink-0" style={{ color: getColor(90) }}>{title}</h3>
            )}

            {/* Course header */}
            <div className="flex items-start justify-between gap-2 shrink-0">
                <div className="min-w-0">
                    <div className="font-data text-base font-bold leading-tight" style={{ color: C }}>{courseTitle}</div>
                    {certificationName && (
                        <div className="font-voice text-base leading-tight mt-0.5" style={{ color: getColor(70) }}>{certificationName}</div>
                    )}
                </div>
                <span className="font-data text-xs uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
                    style={{ backgroundColor: `${diffColor}22`, color: diffColor, border: `1px solid ${diffColor}55` }}>
                    {difficulty}
                </span>
            </div>

            {/* Overall mastery */}
            {overallMastery !== undefined && (
                <div className="shrink-0">
                    <div className="flex justify-between mb-1">
                        <span className="font-data text-base uppercase tracking-wider" style={{ color: getColor(70) }}>Overall Mastery</span>
                        <span className="font-data text-base font-bold" style={{ color: C }}>{overallMastery}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: getColor(15) }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${overallMastery}%`, backgroundColor: C }} />
                    </div>
                </div>
            )}

            {/* Exam stats */}
            {(totalQuestions || passingScore || examDuration) && (
                <div className="grid grid-cols-3 gap-2 shrink-0">
                    {[
                        { icon: <Target size={12} />, label: 'Questions', value: totalQuestions },
                        { icon: <Award size={12} />,  label: 'Passing',   value: passingScore },
                        { icon: <Clock size={12} />,  label: 'Duration',  value: examDuration },
                    ].map(({ icon, label, value }, i) => value !== undefined && (
                        <div key={i} className="flex flex-col items-center p-2 rounded-lg gap-0.5"
                            style={{ backgroundColor: getColor(6), border: `1px solid ${getColor(12)}` }}>
                            <span style={{ color: getColor(70) }}>{icon}</span>
                            <span className="font-data text-base font-bold" style={{ color: C }}>{value}</span>
                            <span className="font-data text-xs uppercase tracking-wider" style={{ color: getColor(55) }}>{label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Domains */}
            <div className="flex-1 flex flex-col gap-1.5 min-h-0 overflow-hidden">
                {visible.map((d, i) => (
                    <div key={i} className="flex flex-col gap-1 px-2 py-1.5 rounded"
                        style={{ backgroundColor: getColor(5), border: `1px solid ${getColor(10)}` }}>
                        <div className="flex items-center justify-between">
                            <span className="font-data text-base leading-tight" style={{ color: getColor(85) }}>
                                <span style={{ color: getColor(55) }}>D{d.number} · </span>{d.title}
                            </span>
                            <span className="font-data text-base shrink-0 ml-2" style={{ color: getColor(60) }}>{d.weight}%</span>
                        </div>
                        {d.masteryScore !== undefined && (
                            <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: getColor(12) }}>
                                <div className="h-full rounded-full" style={{ width: `${d.masteryScore}%`, backgroundColor: C }} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <OverflowPill count={overflow} label="more domains" />
        </div>
    );
};

export default CourseOverviewCard;
