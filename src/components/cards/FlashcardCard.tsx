import React, { useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

const C = 'var(--theme-chart-line)';
const getColor = (o: number) => `color-mix(in srgb, var(--theme-chart-line) ${o}%, transparent)`;

interface Flashcard {
    term: string;
    definition: string;
}

interface FlashcardCardProps {
    title?: string;
    subtitle?: string;
    cards: Flashcard[];
}

export const FlashcardCard: React.FC<FlashcardCardProps> = ({ title, subtitle, cards = [] }) => {
    const [index, setIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [mastered, setMastered] = useState<Set<number>>(new Set());

    if (cards.length === 0) return null;

    const card = cards[index];
    const masteredCount = mastered.size;

    const prev = () => { setIndex(i => Math.max(0, i - 1)); setFlipped(false); };
    const next = () => { setIndex(i => Math.min(cards.length - 1, i + 1)); setFlipped(false); };
    const toggleMastered = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMastered(prev => {
            const n = new Set(prev);
            n.has(index) ? n.delete(index) : n.add(index);
            return n;
        });
    };

    return (
        <div className="flex flex-col h-full overflow-hidden gap-3">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div>
                    {title && <h3 className="font-data text-base uppercase tracking-[0.12em]" style={{ color: getColor(90) }}>{title}</h3>}
                    {subtitle && <p className="font-voice text-base" style={{ color: getColor(60) }}>{subtitle}</p>}
                </div>
                <BookOpen size={16} style={{ color: getColor(55) }} />
            </div>

            {/* Progress */}
            <div className="shrink-0">
                <div className="flex justify-between mb-1">
                    <span className="font-data text-base uppercase tracking-wider" style={{ color: getColor(60) }}>
                        {index + 1} / {cards.length}
                    </span>
                    <span className="font-data text-base" style={{ color: '#22c55e' }}>
                        {masteredCount} mastered
                    </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: getColor(15) }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${(masteredCount / cards.length) * 100}%`, backgroundColor: '#22c55e' }} />
                </div>
            </div>

            {/* Flashcard */}
            <div
                className="flex-1 flex items-center justify-center rounded-xl cursor-pointer select-none min-h-0"
                style={{
                    backgroundColor: flipped ? getColor(10) : getColor(6),
                    border: `1px solid ${flipped ? getColor(28) : getColor(14)}`,
                    transition: 'background-color 0.2s ease',
                }}
                onClick={() => setFlipped(f => !f)}
            >
                <div className="text-center px-4 py-3">
                    <div className="font-data text-xs uppercase tracking-widest mb-2" style={{ color: getColor(50) }}>
                        {flipped ? 'definition' : 'term'}
                    </div>
                    <div className="font-voice text-base leading-relaxed" style={{ color: flipped ? getColor(85) : C }}>
                        {flipped ? card.definition : card.term}
                    </div>
                    <div className="font-data text-xs uppercase tracking-wider mt-3" style={{ color: getColor(40) }}>
                        tap to flip
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between shrink-0">
                <button onClick={prev} disabled={index === 0}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full font-data text-base uppercase tracking-wider transition-opacity"
                    style={{ backgroundColor: getColor(10), color: getColor(70), opacity: index === 0 ? 0.35 : 1 }}>
                    <ChevronLeft size={14} /> Prev
                </button>
                <button onClick={toggleMastered}
                    className="px-3 py-1.5 rounded-full font-data text-base uppercase tracking-wider transition-all"
                    style={{
                        backgroundColor: mastered.has(index) ? '#22c55e22' : getColor(10),
                        color: mastered.has(index) ? '#22c55e' : getColor(60),
                        border: `1px solid ${mastered.has(index) ? '#22c55e55' : getColor(15)}`,
                    }}>
                    {mastered.has(index) ? '✓ Mastered' : 'Mark Mastered'}
                </button>
                <button onClick={next} disabled={index === cards.length - 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full font-data text-base uppercase tracking-wider transition-opacity"
                    style={{ backgroundColor: getColor(10), color: getColor(70), opacity: index === cards.length - 1 ? 0.35 : 1 }}>
                    Next <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
};

export default FlashcardCard;
