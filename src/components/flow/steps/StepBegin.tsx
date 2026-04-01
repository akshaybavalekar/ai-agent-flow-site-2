'use client';

import { useEffect } from 'react';
import { useFlow } from '@/contexts/FlowContext';
import { FlowScreenLayout } from '../FlowScreenLayout';

interface StepBeginProps {
  question?: string;
  avatar?: 'farah' | 'rayan';
  autoAdvance?: boolean;
  autoAdvanceDelay?: number;
}

export function StepBegin({
  question,
  avatar = 'rayan',
  autoAdvance = false,
  autoAdvanceDelay = 2000,
}: StepBeginProps) {
  const { nextStep } = useFlow();

  useEffect(() => {
    if (!autoAdvance) return;
    const timer = setTimeout(() => nextStep(), autoAdvanceDelay);
    return () => clearTimeout(timer);
  }, [autoAdvance, autoAdvanceDelay, nextStep]);

  return (
    <FlowScreenLayout
      question={question ?? 'Let us begin.'}
      flow="welcome"
      hideProgress={true}
      avatar={avatar}
    >
      <div className="flex flex-col items-center justify-center mt-12" />
    </FlowScreenLayout>
  );
}
