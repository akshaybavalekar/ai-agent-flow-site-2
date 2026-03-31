import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface BubbleOption {
  label: string;
  value?: string;
}

interface GlassmorphicOptionsProps {
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
 * Reusable options template — shows interactive bubble options.
 * The question text comes from the voice AI speech bubble.
 */
export function GlassmorphicOptions({
  bubbles = [],
  showProgress = false,
  progressStep = 0,
  progressTotal = 4,
}: GlassmorphicOptionsProps) {
  const [hasSelected, setHasSelected] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleSelect = useCallback((option: BubbleOption, index: number) => {
    if (hasSelected) return;
    
    setHasSelected(true);
    setSelectedIndex(index);
    
    // Simulate sending selection to voice AI
    console.log(`User selected: ${option.label}`);
    
    // Navigate based on selection following trainco flow
    setTimeout(() => {
      const siteFns = (window as any).UIFrameworkSiteFunctions;
      if (siteFns?.navigateToSection) {
        
        if (option.label.includes("ready to start")) {
          // Step 2: Industry qualification
          console.log('Navigating to Industry MultiSelect...');
          siteFns.navigateToSection({
            badge: "trAIn CAREER",
            title: "Industry",
            subtitle: "Which industries interest you?",
            generativeSubsections: [{
              id: "industry",
              templateId: "MultiSelectOptions",
              props: {
                bubbles: [
                  { label: "Technology" },
                  { label: "Finance" },
                  { label: "Healthcare" },
                  { label: "Education" },
                  { label: "Manufacturing" },
                  { label: "Something else" },
                  { label: "I'm not sure" }
                ],
                showProgress: true,
                progressStep: 0,
                progressTotal: 3
              }
            }]
          });
        } else if (option.label.includes("Tell me more")) {
          // Tell me more branch
          console.log('Navigating to Tell Me More options...');
          siteFns.navigateToSection({
            badge: "trAIn CAREER", 
            title: "About trAIn",
            subtitle: "What would you like to know?",
            generativeSubsections: [{
              id: "tell-me-more",
              templateId: "GlassmorphicOptions",
              props: {
                bubbles: [
                  { label: "How does job matching work?" },
                  { label: "What skills can I develop?" },
                  { label: "How do I get started?" },
                  { label: "What makes trAIn different?" },
                  { label: "Something else" }
                ]
              }
            }]
          });
        } else {
          // Default to dashboard for other options
          console.log('Navigating to Dashboard...');
          siteFns.navigateToSection({
            templateId: "Dashboard",
            props: {}
          });
        }
      }
    }, 500);
  }, [hasSelected]);

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

      <div className="flex flex-col gap-3 w-full max-w-sm px-4 pb-32 pointer-events-auto">
        <AnimatePresence>
          {bubbles.map((option, index) => (
            <motion.button
              key={`${option.label}-${index}`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: selectedIndex === index ? 0.95 : 1,
              }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ 
                duration: 0.3, 
                delay: index * 0.1,
                ease: [0.16, 1, 0.3, 1]
              }}
              onClick={() => handleSelect(option, index)}
              disabled={hasSelected}
              className={`
                relative px-6 py-4 rounded-2xl text-left transition-all duration-200
                backdrop-blur-sm border border-white/10
                ${hasSelected && selectedIndex === index
                  ? 'bg-white/20 border-white/30'
                  : 'bg-white/10 hover:bg-white/15 hover:border-white/20'
                }
                ${hasSelected && selectedIndex !== index ? 'opacity-50' : ''}
                disabled:cursor-not-allowed
              `}
            >
              <span className="text-white font-medium text-base">
                {option.label}
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}