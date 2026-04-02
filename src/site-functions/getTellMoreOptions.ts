/**
 * getTellMoreOptions — Welcome Journey Tool for MOBEUS 2.0
 *
 * Returns tell-me-more options for Step 3847-B in navigateToSection format
 * 
 * Registered as window.__siteFunctions.getTellMoreOptions
 * The voice agent can call this via the callSiteFunction RPC and pass the result to navigateToSection.
 */
export default function getTellMoreOptions() {
  return {
    badge: "MOBEUS CAREER",
    title: "Welcome",
    subtitle: "About TrAIn",
    generativeSubsections: [
      {
        id: "3847-B",
        templateId: "GlassmorphicOptions",
        props: {
          options: "How does TrAIn work?|How is TrAIn different?|Can I build skills on TrAIn?|Which jobs can I find on TrAIn?|How does TrAIn use my data?|Something else"
        }
      }
    ]
  };
}