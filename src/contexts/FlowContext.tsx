'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import {
  type FlowId,
  type StepId,
  type IndustryId,
  type PriorityId,
  FLOWS,
  getNextStep,
  getPrevStep,
} from '@/data/flowRegistry';

// Data collected across flows
export interface FlowData {
  readyChoice?: string;
  industry?: IndustryId;
  role?: string;
  priorities?: PriorityId[];
  name?: string;
  email?: string;
  userRole?: 'talent' | 'recruiter';
}

interface FlowContextValue {
  currentFlow: FlowId;
  currentStep: StepId | null;
  flowData: FlowData;
  isVoice: false;

  goToFlow: (flowId: FlowId, opts?: { step?: StepId; data?: Partial<FlowData> }) => void;
  nextStep: (data?: Partial<FlowData>) => void;
  prevStep: () => void;
  skipStep: () => void;
  updateFlowData: (data: Partial<FlowData>) => void;
  setStep: (step: StepId) => void;
}

const FlowContext = createContext<FlowContextValue | null>(null);

function getFirstStep(flowId: FlowId): StepId | null {
  const flow = FLOWS[flowId];
  if (!flow) return null;
  return flow.steps[0] as StepId;
}

export function FlowProvider({ children }: { children: ReactNode }) {
  const [currentFlow, setCurrentFlow] = useState<FlowId>('welcome');
  const [currentStep, setCurrentStep] = useState<StepId | null>('landing');
  const [flowData, setFlowData] = useState<FlowData>({});

  const updateFlowData = useCallback((data: Partial<FlowData>) => {
    setFlowData(prev => ({ ...prev, ...data }));
  }, []);

  const goToFlow = useCallback(
    (flowId: FlowId, opts?: { step?: StepId; data?: Partial<FlowData> }) => {
      if (opts?.data) setFlowData(prev => ({ ...prev, ...opts.data }));
      const step = opts?.step ?? getFirstStep(flowId);
      setCurrentFlow(flowId);
      setCurrentStep(step);
    },
    []
  );

  const setStep = useCallback((step: StepId) => {
    setCurrentStep(step);
  }, []);

  const nextStep = useCallback(
    (data?: Partial<FlowData>) => {
      if (data) setFlowData(prev => ({ ...prev, ...data }));
      if (!currentStep) return;

      // Special transitions: end of welcome → start onboarding
      if (currentFlow === 'welcome' && currentStep === 'insight') {
        setCurrentFlow('onboarding');
        setCurrentStep(getFirstStep('onboarding'));
        return;
      }

      const next = getNextStep(currentFlow, currentStep);
      if (next) setCurrentStep(next);
    },
    [currentFlow, currentStep]
  );

  const prevStep = useCallback(() => {
    if (!currentStep) return;
    const prev = getPrevStep(currentFlow, currentStep);
    if (prev) setCurrentStep(prev);
  }, [currentFlow, currentStep]);

  const skipStep = useCallback(() => nextStep(), [nextStep]);

  return (
    <FlowContext.Provider
      value={{
        currentFlow,
        currentStep,
        flowData,
        isVoice: false,
        goToFlow,
        nextStep,
        prevStep,
        skipStep,
        updateFlowData,
        setStep,
      }}
    >
      {children}
    </FlowContext.Provider>
  );
}

export function useFlow(): FlowContextValue {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error('useFlow must be used within FlowProvider');
  return ctx;
}
