'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFlow } from '@/contexts/FlowContext';
import { INDUSTRY_ROLES, ROLE_POSITIONS, type IndustryId } from '@/data/flowRegistry';
import { FlowScreenLayout } from '../FlowScreenLayout';
import { BubbleOptions, type WelcomeStepOption } from '../BubbleOptions';

interface StepRoleProps {
  question?: string;
  avatar?: 'farah' | 'rayan';
}

export function StepRole({ question, avatar = 'rayan' }: StepRoleProps) {
  const { nextStep, flowData } = useFlow();
  const industry = (flowData.industry ?? '') as IndustryId;

  const [selected, setSelected] = useState<string | null>(null);
  const [showBubbles, setShowBubbles] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowBubbles(true), 200);
    return () => clearTimeout(t);
  }, []);

  const roleOptions: WelcomeStepOption[] = useMemo(() => {
    const roles = [...(INDUSTRY_ROLES[industry] ?? []).slice(0, 4), 'Something else'];
    return roles.map((r, i) => ({ id: r, label: r, ...ROLE_POSITIONS[i] }));
  }, [industry]);

  const handleChoice = (id: string) => {
    setSelected(id);
    setTimeout(() => nextStep({ role: id }), 350);
  };

  return (
    <FlowScreenLayout
      question={question ?? 'Do you have a specific type of role in mind?'}
      flow="welcome"
      avatar={avatar}
    >
      <BubbleOptions
        options={roleOptions}
        show={showBubbles}
        selected={selected}
        onSelect={handleChoice}
      />
    </FlowScreenLayout>
  );
}
