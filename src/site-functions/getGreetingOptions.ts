/**
 * getGreetingOptions — Welcome Journey Tool for MOBEUS 2.0
 *
 * Returns greeting options for Step 3847-A
 * 
 * Registered as window.__siteFunctions.getGreetingOptions
 * The voice agent can call this via the callSiteFunction RPC.
 */
export default function getGreetingOptions(): {
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
    id: "3847-A",
    componentType: "GlassmorphicOptions",
    options: "Yes, I'm ready|Not just yet|Tell me more",
    badge: "MOBEUS CAREER",
    title: "Welcome",
    subtitle: "Getting started"
  };
}