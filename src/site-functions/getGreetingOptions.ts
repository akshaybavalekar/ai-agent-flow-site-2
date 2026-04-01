/**
 * getGreetingOptions — Welcome Journey Tool for MOBEUS 2.0
 *
 * Returns greeting options for Step 3847-A
 * 
 * Registered as window.__siteFunctions.getGreetingOptions
 * The voice agent can call this via the callSiteFunction RPC.
 */
export default function getGreetingOptions(): {
  badge: string;
  title: string;
  subtitle: string;
  generativeSubsections: Array<{
    id: string;
    templateId: string;
    props: {
      bubbles: Array<{ label: string }>;
    };
  }>;
} {
  return {
    badge: "MOBEUS CAREER",
    title: "Welcome",
    subtitle: "Getting started",
    generativeSubsections: [
      {
        id: "start",
        templateId: "GlassmorphicOptions",
        props: {
          bubbles: [
            { label: "Yes, I'm ready" },
            { label: "Not just yet" },
            { label: "Tell me more" }
          ]
        }
      }
    ]
  };
}