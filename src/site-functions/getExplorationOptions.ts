/**
 * getExplorationOptions — Welcome Journey Tool for MOBEUS 2.0
 *
 * Returns exploration options for Step 5921-C in navigateToSection format
 * 
 * Registered as window.__siteFunctions.getExplorationOptions
 * The voice agent can call this via the callSiteFunction RPC and pass the result to navigateToSection.
 */
export default function getExplorationOptions() {
  return {
    badge: "MOBEUS CAREER",
    title: "Exploration",
    subtitle: "Tell us what you enjoy",
    generativeSubsections: [
      {
        id: "5921-C",
        templateId: "MultiSelectOptions",
        props: {
          bubbles: [
            { label: "Solving a puzzle or problem" },
            { label: "Creating something from scratch" },
            { label: "Helping someone through a tough moment" },
            { label: "Organising chaos into order" },
            { label: "Learning something completely new" },
            { label: "Leading a group" }
          ]
        }
      }
    ]
  };
}