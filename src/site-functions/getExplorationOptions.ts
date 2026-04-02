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
          options: "Solving a puzzle or problem|Creating something from scratch|Helping someone through a tough moment|Organising chaos into order|Learning something completely new|Leading a group"
        }
      }
    ]
  };
}