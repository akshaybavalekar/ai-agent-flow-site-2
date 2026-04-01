'use client';

import { useEffect } from 'react';
import { useFlow } from '@/contexts/FlowContext';
import { FlowScreenLayout } from '../FlowScreenLayout';

interface StepLandingProps {
  question?: string;
  avatar?: 'farah' | 'rayan';
  autoAdvance?: boolean;
  autoAdvanceDelay?: number;
}

export function StepLanding({
  question,
  avatar = 'rayan',
  autoAdvance = false,
  autoAdvanceDelay = 10000,
}: StepLandingProps) {
  const { nextStep } = useFlow();

  useEffect(() => {
    if (!autoAdvance) return;
    const timer = setTimeout(() => nextStep(), autoAdvanceDelay);
    return () => clearTimeout(timer);
  }, [autoAdvance, autoAdvanceDelay, nextStep]);

  return (
    <FlowScreenLayout
      question={question ?? 'Welcome! Hope you are doing good!!'}
      flow="welcome"
      hideProgress={true}
      avatar={avatar}
    >
      <button
        onClick={() => nextStep()}
        className="absolute top-0 left-0 right-0 bottom-[10%] cursor-pointer z-10"
        aria-label="Continue"
      />
    </FlowScreenLayout>
  );
}
