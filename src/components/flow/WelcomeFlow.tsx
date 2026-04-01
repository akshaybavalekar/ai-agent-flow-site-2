'use client';

import { useFlow } from '@/contexts/FlowContext';
import { StepLanding } from './steps/StepLanding';
import { StepReady } from './steps/StepReady';
import { StepBegin } from './steps/StepBegin';
import { StepIndustry } from './steps/StepIndustry';
import { StepRole } from './steps/StepRole';
import { StepInsight } from './steps/StepInsight';

/**
 * WelcomeFlow — renders the correct welcome step based on FlowContext state.
 * Each step handles its own auto-advance and bubble animations.
 */
export function WelcomeFlow() {
  const { currentStep } = useFlow();

  switch (currentStep) {
    case 'landing':  return <StepLanding autoAdvance autoAdvanceDelay={6000} />;
    case 'ready':    return <StepReady />;
    case 'begin':    return <StepBegin autoAdvance autoAdvanceDelay={2000} />;
    case 'industry': return <StepIndustry />;
    case 'role':     return <StepRole />;
    case 'insight':  return <StepInsight />;
    default:         return <StepLanding />;
  }
}
