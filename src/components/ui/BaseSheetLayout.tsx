'use client';
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { motion } from "motion/react";

interface BaseSheetLayoutProps {
  testId: string;
  onClose: () => void;
  children: ReactNode;
  /** Tailwind z-index class. Default "z-50". */
  zClass?: string;
  /** Tailwind classes for the scroll area padding/gap. Default "px-4 pt-20 pb-28 flex flex-col gap-6". */
  scrollClassName?: string;
  /** Animate children with a slide-up entrance. Default true. */
  animate?: boolean;
  /** Hide the built-in close button (e.g. when the consumer renders its own header). Default false. */
  hideCloseButton?: boolean;
  /** Optional header content rendered above the scroll area (inside the fixed shell, below close btn). */
  header?: ReactNode;
  /** Optional footer content rendered below the scroll area (pinned to bottom). */
  footer?: ReactNode;
}

const ENTER_TRANSITION = { ease: [0.16, 1, 0.3, 1] as const, duration: 0.35, delay: 0.05 };

export function BaseSheetLayout({
  testId,
  onClose,
  children,
  zClass = "z-50",
  scrollClassName = "px-4 pt-20 pb-28 flex flex-col gap-6",
  animate = true,
  hideCloseButton = false,
  header,
  footer,
}: BaseSheetLayoutProps) {
  return (
    <div
      data-testid={testId}
      className={`fixed inset-0 ${zClass} no-lightboard flex flex-col bg-[var(--bg-sheet)]`}
    >
      {!hideCloseButton && (
        <button
          data-testid={`${testId}-close-btn`}
          onClick={onClose}
          className="fixed top-4 right-4 z-[125] size-10 rounded-full flex items-center justify-center bg-[var(--surface-elevated)] no-lightboard pointer-events-auto"
          aria-label="Close"
        >
          <X size={20} className="text-[var(--text-primary)]" />
        </button>
      )}

      {header}

      {animate ? (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={ENTER_TRANSITION}
          className={`flex-1 overflow-y-auto ${scrollClassName}`}
        >
          {children}
        </motion.div>
      ) : (
        <div className={`flex-1 overflow-y-auto ${scrollClassName}`}>
          {children}
        </div>
      )}

      {footer}
    </div>
  );
}
