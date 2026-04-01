/**
 * Flow Registry
 * Defines step sequences for all flows and static data used within flows.
 */

export type FlowId = 'welcome' | 'onboarding' | 'dashboard' | 'jobs';

export type WelcomeStepId = 'landing' | 'ready' | 'begin' | 'industry' | 'role' | 'insight';
export type OnboardingStepId = 'auth' | 'otp' | 'name' | 'greeting' | 'profileSource';
export type DashboardStepId = 'entry' | 'hub';
export type JobsStepId = 'entry' | 'results';

export type StepId = WelcomeStepId | OnboardingStepId | DashboardStepId | JobsStepId;

export interface StaticFlowConfig {
  steps: StepId[];
}

export const FLOWS: Record<FlowId, StaticFlowConfig> = {
  welcome:    { steps: ['landing', 'ready', 'begin', 'industry', 'role', 'insight'] },
  onboarding: { steps: ['auth', 'otp', 'name', 'greeting', 'profileSource'] },
  dashboard:  { steps: ['entry', 'hub'] },
  jobs:       { steps: ['entry', 'results'] },
};

// Industry options displayed in Welcome Step 2
export const INDUSTRIES = [
  { id: 'technology',  label: 'Technology' },
  { id: 'finance',     label: 'Finance' },
  { id: 'construction',label: 'Construction' },
  { id: 'healthcare',  label: 'Healthcare' },
  { id: 'other',       label: 'Something else' },
] as const;

export type IndustryId = typeof INDUSTRIES[number]['id'];

// Industry → Role options for Welcome Step 3
export const INDUSTRY_ROLES: Record<IndustryId, string[]> = {
  technology: ['AI Engineer', 'Frontend Developer', 'Data Scientist', 'Cloud Architect', 'Cybersecurity Analyst'],
  finance:    ['Financial Analyst', 'Risk Manager', 'FinTech Developer', 'Investment Banker', 'Compliance Officer'],
  construction: ['Project Manager', 'Structural Engineer', 'Site Supervisor', 'BIM Specialist', 'Quantity Surveyor'],
  healthcare: ['Clinical Data Analyst', 'Health Informatics', 'Medical Researcher', 'Biomedical Engineer', 'Hospital Administrator'],
  other: [],
};

// Market insight copy for Welcome Step 4
export const MARKET_INSIGHTS: Record<string, string> = {
  'technology:ai engineer':          "We've observed a 64% increase in AI-related job postings in the past 90 days.",
  'technology:data scientist':       'Data science roles have grown 48% in the Gulf region since 2024.',
  'technology:cloud architect':      'Cloud infrastructure demand is up 57%, largely driven by Vision 2030 digital initiatives.',
  'technology:cybersecurity analyst':'Cybersecurity roles carry a 0.3% unemployment rate in Saudi Arabia right now.',
  'technology:frontend developer':   "Frontend roles grew 39% following Saudi Arabia's tech startup surge.",
  'finance:fintech developer':       'FinTech roles have grown 41% year-over-year, driven by Vision 2030 banking reforms.',
  'finance:financial analyst':       'Financial services employment is projected to grow 33% by 2030 in the Kingdom.',
  'construction:project manager':    'Saudi Giga-projects have created 28,000+ construction management roles across NEOM, Red Sea, and Diriyah.',
  'healthcare:clinical data analyst':'Healthcare data roles grew 52% as Saudi Arabia accelerates its health tech transformation.',
};

export const DEFAULT_MARKET_INSIGHT =
  "We're seeing strong growth in your chosen field — demand is high across Vision 2030 sectors.";

export function getMarketInsight(industryId: string, role: string): string {
  const key = `${industryId}:${role.toLowerCase()}`;
  return MARKET_INSIGHTS[key] ?? DEFAULT_MARKET_INSIGHT;
}

// Ready step options
export interface ReadyOption {
  id: string;
  label: string;
  leftPct: number;
  topPct: number;
  primary?: boolean;
}

export const READY_OPTIONS: Record<'talent' | 'recruiter', ReadyOption[]> = {
  talent: [
    { id: 'ready',        label: "Yes, I'm ready", leftPct: 39.8, topPct: 70.2, primary: true },
    { id: 'not-yet',      label: 'Not just yet',   leftPct: 12.5, topPct: 79.7 },
    { id: 'tell-me-more', label: 'Tell me more',   leftPct: 57.3, topPct: 83.5 },
  ],
  recruiter: [
    { id: 'ready',        label: "Yes, let's go",  leftPct: 39.8, topPct: 70.2, primary: true },
    { id: 'not-yet',      label: 'Not just yet',   leftPct: 12.5, topPct: 79.7 },
    { id: 'tell-me-more', label: 'Tell me more',   leftPct: 57.3, topPct: 83.5 },
  ],
};

// Job search priority options
export const JOB_PRIORITIES = [
  { id: 'browse',   label: 'Searching and browsing listings' },
  { id: 'fit',      label: 'Experience and personality fit' },
  { id: 'location', label: 'Location' },
  { id: 'skills',   label: 'Know which skills are required' },
  { id: 'learn',    label: 'Take courses and earn certifications' },
  { id: 'other',    label: 'Something else' },
] as const;

export type PriorityId = typeof JOB_PRIORITIES[number]['id'];

// Percentage-based bubble positions
export const ROLE_POSITIONS: ReadonlyArray<{ leftPct: number; topPct: number }> = [
  { leftPct: 10.0, topPct: 67.3 },
  { leftPct: 50.0, topPct: 68.8 },
  { leftPct: 10.0, topPct: 76.2 },
  { leftPct: 60.9, topPct: 79.3 },
  { leftPct: 19.8, topPct: 84.9 },
];

export const PRIORITY_POSITIONS: Readonly<Record<string, { leftPct: number; topPct: number }>> = {
  browse:   { leftPct: 20.0, topPct: 56.5 },
  fit:      { leftPct:  5.5, topPct: 64.0 },
  location: { leftPct: 65.9, topPct: 64.0 },
  skills:   { leftPct: 32.7, topPct: 70.9 },
  learn:    { leftPct: 12.5, topPct: 77.9 },
  other:    { leftPct: 33.6, topPct: 84.9 },
};

export const INDUSTRY_POSITIONS: Array<{ leftPct: number; topPct: number }> = [
  { leftPct: 23.2, topPct: 67.3 },
  { leftPct: 63.9, topPct: 69.0 },
  { leftPct: 10.0, topPct: 76.2 },
  { leftPct: 58.9, topPct: 79.3 },
  { leftPct: 19.8, topPct: 84.9 },
];

export const GENERIC_POSITIONS: ReadonlyArray<{ leftPct: number; topPct: number }> = [
  { leftPct: 10.0, topPct: 67.3 },
  { leftPct: 50.0, topPct: 68.8 },
  { leftPct: 10.0, topPct: 76.2 },
  { leftPct: 60.9, topPct: 79.3 },
  { leftPct: 19.8, topPct: 84.9 },
  { leftPct: 55.0, topPct: 87.5 },
];

export function getNextStep(flowId: FlowId, currentStep: StepId): StepId | null {
  const flow = FLOWS[flowId];
  if (!flow) return null;
  const steps = flow.steps as StepId[];
  const idx = steps.indexOf(currentStep);
  if (idx === -1 || idx === steps.length - 1) return null;
  return steps[idx + 1];
}

export function getPrevStep(flowId: FlowId, currentStep: StepId): StepId | null {
  const flow = FLOWS[flowId];
  if (!flow) return null;
  const steps = flow.steps as StepId[];
  const idx = steps.indexOf(currentStep);
  if (idx <= 0) return null;
  return steps[idx - 1];
}
