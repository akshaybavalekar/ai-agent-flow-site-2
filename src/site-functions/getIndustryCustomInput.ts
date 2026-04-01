/**
 * getIndustryCustomInput — Welcome Journey Tool for MOBEUS 2.0
 *
 * Returns custom industry input for Step 5921-B
 * 
 * Registered as window.__siteFunctions.getIndustryCustomInput
 * The voice agent can call this via the callSiteFunction RPC.
 */
export default function getIndustryCustomInput(): {
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
    id: "5921-B",
    componentType: "TextInput",
    placeholder: "Type industry",
    badge: "MOBEUS CAREER",
    title: "Qualification",
    subtitle: "Step 1 of 3"
  };
}