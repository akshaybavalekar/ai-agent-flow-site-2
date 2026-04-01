import React from 'react';
import { Target } from 'lucide-react';

const C = 'var(--theme-chart-line)';
const getColor = (o: number) => `color-mix(in srgb, var(--theme-chart-line) ${o}%, transparent)`;

const DIFFICULTY_COLOR: Record<string, string> = {
    easy:   '#22c55e',
    medium: '#f59e0b',
    hard:   '#ff4040',
};

interface QuizOption {
    text: string;
    correct?: boolean;
}

interface SkillQuizCardProps {
    title?: string;
    skillName: string;
    question: string;
    options: QuizOption[];
    currentScore?: number;
    totalQuestions?: number;
    questionsAnswered?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    explanation?: string;
    selectedAnswer?: number;
}

export const SkillQuizCard: React.FC<SkillQuizCardProps> = ({
    title,
    skillName,
    question,
    options = [],
    currentScore,
    totalQuestions,
    questionsAnswered,
    difficulty = 'medium',
    explanation,
    selectedAnswer,
}) => {
    const diffColor = DIFFICULTY_COLOR[difficulty] ?? C;

    return (
        <div className="flex flex-col h-full overflow-hidden gap-3">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Target size={14} style={{ color: C }} />
                    {title && <h3 className="font-data text-base uppercase tracking-[0.12em]" style={{ color: getColor(90) }}>{title}</h3>}
                    {!title && <span className="font-data text-base uppercase tracking-[0.12em]" style={{ color: getColor(90) }}>{skillName}</span>}
                </div>
                <span className="font-data text-xs uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${diffColor}22`, color: diffColor }}>
                    {difficulty}
                </span>
            </div>

            {/* Progress */}
            {(totalQuestions !== undefined) && (
                <div className="shrink-0">
                    <div className="flex justify-between mb-1">
                        <span className="font-data text-base uppercase tracking-wider" style={{ color: getColor(60) }}>
                            {questionsAnswered ?? 0}/{totalQuestions} questions
                        </span>
                        {currentScore !== undefined && (
                            <span className="font-data text-base font-bold" style={{ color: C }}>{currentScore} pts</span>
                        )}
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: getColor(15) }}>
                        <div className="h-full rounded-full" style={{
                            width: `${((questionsAnswered ?? 0) / totalQuestions) * 100}%`,
                            backgroundColor: C,
                        }} />
                    </div>
                </div>
            )}

            {/* Question */}
            <div className="px-3 py-2 rounded-lg shrink-0"
                style={{ backgroundColor: getColor(8), border: `1px solid ${getColor(18)}` }}>
                <p className="font-voice text-base leading-relaxed" style={{ color: getColor(90) }}>{question}</p>
            </div>

            {/* Options */}
            <div className="flex-1 flex flex-col gap-1.5 min-h-0 overflow-auto">
                {options.map((opt, i) => {
                    const isSelected = selectedAnswer === i;
                    const isCorrect = opt.correct;
                    const showResult = selectedAnswer !== undefined;
                    const borderColor = showResult
                        ? isCorrect ? '#22c55e55' : isSelected ? '#ff404055' : getColor(12)
                        : isSelected ? getColor(30) : getColor(12);
                    const bgColor = showResult
                        ? isCorrect ? '#22c55e11' : isSelected ? '#ff404011' : getColor(4)
                        : isSelected ? getColor(12) : getColor(4);
                    const labelColor = showResult
                        ? isCorrect ? '#22c55e' : isSelected ? '#ff4040' : getColor(65)
                        : isSelected ? C : getColor(70);

                    return (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded"
                            style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>
                            <span className="font-data text-base shrink-0 w-5 text-center"
                                style={{ color: labelColor }}>{String.fromCharCode(65 + i)}</span>
                            <span className="font-voice text-base leading-snug" style={{ color: labelColor }}>{opt.text}</span>
                        </div>
                    );
                })}
            </div>

            {/* Explanation */}
            {explanation && (
                <div className="px-3 py-2 rounded shrink-0"
                    style={{ backgroundColor: getColor(6), border: `1px solid ${getColor(12)}` }}>
                    <p className="font-voice text-base leading-relaxed italic" style={{ color: getColor(70) }}>{explanation}</p>
                </div>
            )}
        </div>
    );
};

export default SkillQuizCard;
