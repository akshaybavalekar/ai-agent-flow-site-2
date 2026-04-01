'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFlow } from '@/contexts/FlowContext';
import {
  JOB_PRIORITIES,
  PRIORITY_POSITIONS,
  getMarketInsight,
  type IndustryId,
  type PriorityId,
} from '@/data/flowRegistry';
import { FlowScreenLayout } from '../FlowScreenLayout';
import { BubbleOptions, type WelcomeStepOption } from '../BubbleOptions';

interface StepInsightProps {
  avatar?: 'farah' | 'rayan';
}

export function StepInsight({ avatar = 'rayan' }: StepInsightProps) {
  const { nextStep, flowData } = useFlow();
  const industry = (flowData.industry ?? '') as IndustryId;
  const insight = getMarketInsight(industry, flowData.role ?? '');

  const [selected, setSelected] = useState<string | null>(null);
  const [showBubbles, setShowBubbles] = useState(false);
  const [showPriority, setShowPriority] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowBubbles(true), 200);
    const t2 = setTimeout(() => setShowPriority(true), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const priorityOpts: WelcomeStepOption[] = useMemo(
    () => JOB_PRIORITIES.map(p => ({ ...p, ...PRIORITY_POSITIONS[p.id] })),
    []
  );

  const handleChoice = (id: string) => {
    setSelected(id);
    setTimeout(() => nextStep({ priorities: [id as PriorityId] }), 1500);
  };

  const displayQuestion = showPriority
    ? 'What is most important to you in your job search?'
    : insight;

  return (
    <FlowScreenLayout
      question={displayQuestion}
      questionWrap={true}
      flow="welcome"
      progressDots={2}
      avatar={avatar}
    >
      {!showPriority && (
        <button
          onClick={() => setShowPriority(true)}
          className="absolute top-0 left-0 right-0 bottom-[10%] cursor-pointer z-10"
          aria-label="Continue"
        />
      )}
      <BubbleOptions
        options={priorityOpts}
        show={showBubbles && showPriority}
        selected={selected}
        onSelect={handleChoice}
      />
    </FlowScreenLayout>
  );
}
