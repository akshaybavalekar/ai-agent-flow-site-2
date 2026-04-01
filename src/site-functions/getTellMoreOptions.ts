/**
 * getTellMoreOptions — Welcome Journey Tool for MOBEUS 2.0
 *
 * Returns tell-me-more options for Step 3847-B
 * 
 * Registered as window.__siteFunctions.getTellMoreOptions
 * The voice agent can call this via the callSiteFunction RPC.
 */
export default function getTellMoreOptions(): {
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
    id: "3847-B",
    componentType: "GlassmorphicOptions",
    options: "How does TrAIn work?|How is TrAIn different?|Can I build skills on TrAIn?|Which jobs can I find on TrAIn?|How does TrAIn use my data?|Something else",
    badge: "MOBEUS CAREER",
    title: "Welcome",
    subtitle: "About TrAIn"
  };
}