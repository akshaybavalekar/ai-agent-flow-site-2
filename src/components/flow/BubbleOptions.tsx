'use client';

import { FloatingBubble } from './FlowScreenLayout';

export interface WelcomeStepOption {
  id: string;
  label: string;
  leftPct: number;
  topPct: number;
  primary?: boolean;
}

interface BubbleOptionsProps {
  options: WelcomeStepOption[];
  show: boolean;
  selected: string | null;
  onSelect: (id: string) => void;
}

export function BubbleOptions({ options, show, selected, onSelect }: BubbleOptionsProps) {
  if (!show) return null;
  return (
    <>
      {options.map((opt, i) => (
        <FloatingBubble
          key={opt.id}
          label={opt.label}
          leftPct={opt.leftPct}
          topPct={opt.topPct}
          onClick={() => onSelect(opt.id)}
          selected={selected === opt.id}
          primary={opt.primary}
          animationIndex={i}
        />
      ))}
    </>
  );
}
