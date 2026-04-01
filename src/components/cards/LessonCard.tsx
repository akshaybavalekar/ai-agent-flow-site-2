import React, { useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

const C = 'var(--theme-chart-line)';
const getColor = (o: number) => `color-mix(in srgb, var(--theme-chart-line) ${o}%, transparent)`;

const DIFF_COLOR: Record<string, string> = {
    Beginner:     '#22c55e',
    Intermediate: '#f59e0b',
    Advanced:     '#ff4040',
};

interface LessonStep {
    stepNumber: number;
    title: string;
    description: string;
    tips?: string[];
    duration?: string;
}

interface LessonCardProps {
    title?: string;
    lessonTitle: string;
    lessonSubtitle?: string;
    steps: LessonStep[];
    skill?: string;
    difficulty?: string;
}

export const LessonCard: React.FC<LessonCardProps> = ({
    title,
    lessonTitle,
    lessonSubtitle,
    steps = [],
    skill,
    difficulty = 'Beginner',
}) => {
    const [idx, setIdx] = useState(0);
    if (steps.length === 0) return null;

    const step = steps[idx];
    const diffColor = DIFF_COLOR[difficulty] ?? C;

    return (
        <div className="flex flex-col h-full overflow-hidden gap-3">
            {/* Card title */}
            {title && <h3 className="font-data text-base uppercase tracking-[0.12em] shrink-0" style={{ color: getColor(90) }}>{title}</h3>}

            {/* Lesson header */}
            <div className="flex items-start justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <BookOpen size={14} style={{ color: C }} />
                    <div>
                        <div className="font-data text-base font-bold leading-tight" style={{ color: C }}>{lessonTitle}</div>
                        {lessonSubtitle && <div className="font-voice text-base" style={{ color: getColor(60) }}>{lessonSubtitle}</div>}
                    </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    {skill && (
                        <span className="font-data text-xs uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: getColor(12), color: getColor(70) }}>{skill}</span>
                    )}
                    <span className="font-data text-xs uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${diffColor}22`, color: diffColor }}>{difficulty}</span>
                </div>
            </div>

            {/* Dot progress */}
            <div className="flex items-center justify-center gap-1.5 shrink-0">
                {steps.map((_, i) => (
                    <div key={i} className="rounded-full transition-all duration-300"
                        style={{
                            width: i === idx ? 20 : 8,
                            height: 8,
                            backgroundColor: i === idx ? C : getColor(20),
                        }} />
                ))}
                <span className="ml-2 font-data text-xs" style={{ color: getColor(55) }}>{idx + 1} of {steps.length}</span>
            </div>

            {/* Step content */}
            <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-auto px-1">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center font-data text-base font-bold shrink-0"
                        style={{ backgroundColor: C, color: '#000' }}>{step.stepNumber}</div>
                    <span className="font-data text-base font-bold" style={{ color: getColor(92) }}>{step.title}</span>
                    {step.duration && <span className="font-data text-xs ml-auto shrink-0" style={{ color: getColor(50) }}>{step.duration}</span>}
                </div>
                <p className="font-voice text-base leading-relaxed" style={{ color: getColor(75) }}>{step.description}</p>
                {step.tips && step.tips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {step.tips.map((tip, ti) => (
                            <span key={ti} className="font-voice text-base px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: getColor(10), color: getColor(70) }}>
                                💡 {tip}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between shrink-0">
                <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full font-data text-base uppercase tracking-wider"
                    style={{ backgroundColor: getColor(10), color: getColor(65), opacity: idx === 0 ? 0.35 : 1 }}>
                    <ChevronLeft size={14} /> Prev
                </button>
                <button onClick={() => setIdx(i => Math.min(steps.length - 1, i + 1))} disabled={idx === steps.length - 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full font-data text-base uppercase tracking-wider"
                    style={{ backgroundColor: getColor(10), color: getColor(65), opacity: idx === steps.length - 1 ? 0.35 : 1 }}>
                    Next <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
};

export default LessonCard;
