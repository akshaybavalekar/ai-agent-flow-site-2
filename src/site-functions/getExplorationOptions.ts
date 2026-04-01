/**
 * getExplorationOptions — Welcome Journey Tool for MOBEUS 2.0
 *
 * Returns exploration options for Step 5921-C
 * 
 * Registered as window.__siteFunctions.getExplorationOptions
 * The voice agent can call this via the callSiteFunction RPC.
 */
export default function getExplorationOptions(): {
  badge: string;
  title: string;
  subtitle: string;
  generativeSubsections: Array<{
    id: string;
    templateId: string;
    props: {
      bubbles: Array<{ label: string }>;
      showProgress: boolean;
    };
  }>;
} {
  return {
    badge: "MOBEUS CAREER",
    title: "Exploration",
    subtitle: "Tell us what you enjoy",
    generativeSubsections: [
      {
        id: "exploration",
        templateId: "MultiSelectOptions",
        props: {
          bubbles: [
            { label: "Solving a puzzle or problem" },
            { label: "Creating something from scratch" },
            { label: "Helping someone through a tough moment" },
            { label: "Organising chaos into order" },
            { label: "Learning something completely new" },
            { label: "Leading a group" }
          ],
          showProgress: false
        }
      }
    ]
  };
}