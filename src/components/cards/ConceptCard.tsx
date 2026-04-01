import React from 'react';
import { Lightbulb } from 'lucide-react';
import { clampList } from '@/utils/clampList';
import { OverflowPill } from './OverflowPill';

const C = 'var(--theme-chart-line)';
const getColor = (o: number) => `color-mix(in srgb, var(--theme-chart-line) ${o}%, transparent)`;

interface ConceptCardProps {
    title?: string;
    term: string;
    definition: string;
    explanation?: string;
    examples?: string[];
    relatedTerms?: string[];
    examTip?: string;
    category?: string;
}

export const ConceptCard: React.FC<ConceptCardProps> = ({
    title,
    term,
    definition,
    explanation,
    examples = [],
    relatedTerms = [],
    examTip,
    category,
}) => {
    const { visible: visExamples, overflow } = clampList(examples, 3);

    return (
        <div className="flex flex-col h-full overflow-hidden gap-3">
            {/* Header */}
            <div className="flex items-start justify-between shrink-0">
                <div>
                    {title && <h3 className="font-data text-base uppercase tracking-[0.12em]" style={{ color: getColor(90) }}>{title}</h3>}
                    <div className="font-data text-base font-bold mt-0.5" style={{ color: C }}>{term}</div>
                </div>
                {category && (
                    <span className="font-data text-xs uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
                        style={{ backgroundColor: getColor(12), color: getColor(70) }}>{category}</span>
                )}
            </div>

            {/* Definition */}
            <div className="shrink-0 px-3 py-2 rounded-lg"
                style={{ backgroundColor: getColor(8), border: `1px solid ${getColor(18)}` }}>
                <p className="font-voice text-base leading-relaxed font-medium" style={{ color: getColor(90) }}>{definition}</p>
            </div>

            {/* Explanation */}
            {explanation && (
                <p className="font-voice text-base leading-relaxed shrink-0" style={{ color: getColor(70) }}>{explanation}</p>
            )}

            {/* Examples */}
            {visExamples.length > 0 && (
                <div className="shrink-0">
                    <div className="font-data text-base uppercase tracking-wider mb-1" style={{ color: getColor(60) }}>Examples</div>
                    <div className="flex flex-col gap-1">
                        {visExamples.map((ex, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <span className="font-data text-xs shrink-0 mt-0.5" style={{ color: C }}>→</span>
                                <span className="font-voice text-base leading-snug" style={{ color: getColor(75) }}>{ex}</span>
                            </div>
                        ))}
                    </div>
                    <OverflowPill count={overflow} label="more examples" />
                </div>
            )}

            {/* Related terms */}
            {relatedTerms.length > 0 && (
                <div className="flex flex-wrap gap-1.5 shrink-0">
                    {relatedTerms.slice(0, 5).map((t, i) => (
                        <span key={i} className="font-data text-xs uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: getColor(8), color: getColor(65), border: `1px solid ${getColor(15)}` }}>
                            {t}
                        </span>
                    ))}
                </div>
            )}

            {/* Exam tip */}
            {examTip && (
                <div className="flex items-start gap-2 px-3 py-2 rounded mt-auto shrink-0"
                    style={{ backgroundColor: '#f59e0b11', border: '1px solid #f59e0b33' }}>
                    <Lightbulb size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
                    <p className="font-voice text-base leading-snug" style={{ color: '#f59e0b' }}>{examTip}</p>
                </div>
            )}
        </div>
    );
};

export default ConceptCard;
