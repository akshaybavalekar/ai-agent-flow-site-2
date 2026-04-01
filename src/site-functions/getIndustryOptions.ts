/**
 * getIndustryOptions — Welcome Journey Tool for MOBEUS 2.0
 *
 * Returns industry selection options for Step 5921-A
 * 
 * Registered as window.__siteFunctions.getIndustryOptions
 * The voice agent can call this via the callSiteFunction RPC.
 */
export default function getIndustryOptions(): {
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
    id: "5921-A",
    componentType: "MultiSelectOptions",
    options: "Technology|Finance|Healthcare|Construction|Something else|I'm not sure",
    badge: "MOBEUS CAREER",
    title: "Qualification",
    subtitle: "Step 1 of 3",
    progress: { progressStep: 0, progressTotal: 3 }
  };
}