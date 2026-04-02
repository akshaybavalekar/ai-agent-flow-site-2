/**
 * getGreetingOptions — Welcome Journey Tool for MOBEUS 2.0
 *
 * Returns greeting options for Step 3847-A in navigateToSection format
 * 
 * Registered as window.__siteFunctions.getGreetingOptions
 * The voice agent can call this via the callSiteFunction RPC and pass the result to navigateToSection.
 */
export default function getGreetingOptions() {
  const payload = {
    badge: "MOBEUS CAREER",
    title: "Welcome",
    subtitle: "Getting started",
    generativeSubsections: [
      {
        id: "3847-A",
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
  
  console.log("[getGreetingOptions] Returning payload:", JSON.stringify(payload, null, 2));
  return payload;
}