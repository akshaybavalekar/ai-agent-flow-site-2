'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFlow } from '@/contexts/FlowContext';
import { READY_OPTIONS } from '@/data/flowRegistry';
import { FlowScreenLayout } from '../FlowScreenLayout';
import { BubbleOptions } from '../BubbleOptions';

interface StepReadyProps {
  question?: string;
  avatar?: 'farah' | 'rayan';
}

export function StepReady({ question, avatar = 'rayan' }: StepReadyProps) {
  const { nextStep, updateFlowData, flowData } = useFlow();
  const [selected, setSelected] = useState<string | null>(null);
  const [showBubbles, setShowBubbles] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowBubbles(true), 800);
    return () => clearTimeout(t);
  }, []);

  const role = (flowData.userRole ?? 'talent') as 'talent' | 'recruiter';
  const readyOptions = useMemo(() => READY_OPTIONS[role], [role]);

  const handleChoice = (id: string) => {
    setSelected(id);
    setTimeout(() => {
      updateFlowData({ readyChoice: id });
      nextStep({ readyChoice: id });
    }, 350);
  };

  return (
    <FlowScreenLayout
      question={question ?? 'Are you ready to start your journey?'}
      flow="welcome"
      hideProgress={true}
      avatar={avatar}
    >
      <BubbleOptions
        options={readyOptions}
        show={showBubbles}
        selected={selected}
        onSelect={handleChoice}
      />
    </FlowScreenLayout>
  );
}
