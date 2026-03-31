'use client';

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface BubbleOption {
  label: string;
  value?: string;
}

interface MultiSelectOptionsProps {
  /** Answer bubble options. Required. */
  bubbles: BubbleOption[];
  /** Whether to show the top progress bar. */
  showProgress?: boolean;
  /** Current step index for the progress bar (0-based). */
  progressStep?: number;
  /** Total number of steps for the progress bar. */
  progressTotal?: number;
}

/**
 * Multi-select template for qualification (industry/role/priority).
 * Shows chips with Continue button.
 */
export function MultiSelectOptions({
  bubbles = [],
  showProgress = false,
  progressStep = 0,
  progressTotal = 3,
}: MultiSelectOptionsProps) {
  const [selectedOptions, setSelectedOptions] = useState<Set<number>>(new Set());
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleToggleOption = useCallback((index: number) => {
    if (hasSubmitted) return;
    
    setSelectedOptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, [hasSubmitted]);

  const handleContinue = useCallback(() => {
    if (hasSubmitted || selectedOptions.size === 0) return;
    
    setHasSubmitted(true);
    
    const selectedLabels = Array.from(selectedOptions)
      .map(index => bubbles[index]?.label)
      .filter(Boolean);
    
    console.log(`User selected: ${selectedLabels.join(', ')}`);
    
    // Auto-dismiss after selection
    setTimeout(() => {
      console.log('MultiSelect should dismiss now');
    }, 500);
  }, [hasSubmitted, selectedOptions, bubbles]);

  const total = Math.max(1, progressTotal);
  const activeCount = Math.min(Math.max(0, progressStep + 1), total);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-end pointer-events-none">
      {showProgress && (
        <div
          className="flex justify-center gap-1.5 w-full max-w-[200px] mb-8"
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
                backgroundColor: i < activeCount 
                  ? 'var(--theme-chart-line)' 
                  : 'color-mix(in srgb, var(--theme-chart-line) 12%, transparent)',
              }}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4 w-full max-w-sm px-4 pb-32 pointer-events-auto">
        {/* Multi-select options */}
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {bubbles.map((option, index) => (
              <motion.button
                key={`${option.label}-${index}`}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.05,
                  ease: [0.16, 1, 0.3, 1]
                }}
                onClick={() => handleToggleOption(index)}
                disabled={hasSubmitted}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                  backdrop-blur-sm border
                  ${selectedOptions.has(index)
                    ? 'bg-white/20 border-white/40 text-white'
                    : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/15 hover:border-white/30'
                  }
                  ${hasSubmitted ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {option.label}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Continue button */}
        {selectedOptions.size > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleContinue}
            disabled={hasSubmitted}
            className={`
              px-6 py-3 rounded-full font-semibold text-base transition-all duration-200
              backdrop-blur-sm border border-white/20
              ${hasSubmitted 
                ? 'bg-white/10 opacity-50 cursor-not-allowed'
                : 'bg-white/15 hover:bg-white/20 text-white'
              }
            `}
          >
            Continue →
          </motion.button>
        )}
      </div>
    </div>
  );
}