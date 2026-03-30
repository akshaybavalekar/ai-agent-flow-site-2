import React from 'react';

const C = 'var(--theme-chart-line)';
const getColor = (opacity: number) =>
    `color-mix(in srgb, var(--theme-chart-line) ${opacity}%, transparent)`;

/** Mirrors AvatarScreen: optional step progress + question pill (no absolute layout). */
interface AvatarPromptCardProps {
    question?: string;
    showProgress?: boolean;
    progressStep?: number;
    progressTotal?: number;
    questionWide?: boolean;
}

export const AvatarPromptCard: React.FC<AvatarPromptCardProps> = ({
    question,
    showProgress = true,
    progressStep = 0,
    progressTotal = 4,
    questionWide = false,
}) => {
    const total = Math.max(1, progressTotal);
    // 0-based step → highlight through current step (step 0 = first segment active)
    const activeCount = Math.min(Math.max(0, progressStep + 1), total);

    return (
        <div className="flex flex-col h-full justify-start items-center gap-5 pt-1 px-1">
            {showProgress && (
                <div
                    className="flex justify-center gap-1.5 w-full max-w-[200px]"
                    role="progressbar"
                    aria-valuenow={progressStep}
                    aria-valuemin={0}
                    aria-valuemax={total - 1}
                >
                    {Array.from({ length: total }, (_, i) => (
                        <div
                            key={i}
                            className="h-1 flex-1 rounded-full transition-colors duration-200"
                            style={{
                                backgroundColor: i < activeCount ? C : getColor(12),
                            }}
                        />
                    ))}
                </div>
            )}

            {question && (
                <div
                    className={
                        'font-voice max-w-full bg-[var(--surface-muted)]/60 text-[var(--text-secondary)] text-[16px] font-normal leading-5 rounded-[100px] px-4 py-3 text-center ' +
                        (questionWide ? 'w-full' : '')
                    }
                >
                    {question}
                </div>
            )}
        </div>
    );
};

export default AvatarPromptCard;
