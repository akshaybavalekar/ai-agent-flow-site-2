/**
 * getExplorationOptions — Welcome Journey Tool for MOBEUS 2.0
 *
 * Returns exploration options for Step 5921-C
 * 
 * Registered as window.__siteFunctions.getExplorationOptions
 * The voice agent can call this via the callSiteFunction RPC.
 */
export default function getExplorationOptions(): {
  id: string;
  componentType: 'GlassmorphicOptions' | 'MultiSelectOptions' | 'TextInput' | 'RegistrationForm';
  options?: string;
  badge: string;
  title: string;
  subtitle: string;
  progress?: { progressStep: number; progressTotal: number };
  placeholder?: string;
  error?: string;
} {
  return {
    id: "5921-C",
    componentType: "MultiSelectOptions",
    options: "Solving a puzzle or problem|Creating something from scratch|Helping someone through a tough moment|Organising chaos into order|Learning something completely new|Leading a group",
    badge: "MOBEUS CAREER",
    title: "Exploration",
    subtitle: "Tell us what you enjoy"
  };
}