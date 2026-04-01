'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFlow } from '@/contexts/FlowContext';
import { INDUSTRIES, INDUSTRY_POSITIONS, type IndustryId } from '@/data/flowRegistry';
import { FlowScreenLayout } from '../FlowScreenLayout';
import { BubbleOptions, type WelcomeStepOption } from '../BubbleOptions';

interface StepIndustryProps {
  question?: string;
  avatar?: 'farah' | 'rayan';
}

export function StepIndustry({ question, avatar = 'rayan' }: StepIndustryProps) {
  const { nextStep } = useFlow();
  const [selected, setSelected] = useState<string | null>(null);
  const [showBubbles, setShowBubbles] = useState(false);
  const [showOptions, setShowOptions] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowBubbles(true), 200);
    return () => clearTimeout(t);
  }, []);

  const industryOptions: WelcomeStepOption[] = useMemo(
    () =>
      INDUSTRIES.map((ind, i) => ({
        id: ind.id,
        label: ind.label,
        ...INDUSTRY_POSITIONS[i],
      })),
    []
  );

  const handleChoice = (id: string) => {
    setSelected(id);
    setTimeout(() => nextStep({ industry: id as IndustryId }), 350);
  };

  return (
    <FlowScreenLayout
      question={question ?? 'Which industry are you interested in?'}
      flow="welcome"
      avatar={avatar}
    >
      {!showOptions && (
        <button
          onClick={() => setShowOptions(true)}
          className="absolute top-0 left-0 right-0 bottom-[10%] cursor-pointer z-10"
          aria-label="Continue"
        />
      )}
      <BubbleOptions
        options={industryOptions}
        show={showBubbles && showOptions}
        selected={selected}
        onSelect={handleChoice}
      />
    </FlowScreenLayout>
  );
}
