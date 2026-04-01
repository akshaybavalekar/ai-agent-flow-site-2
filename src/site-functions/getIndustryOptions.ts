/**
 * getIndustryOptions — Welcome Journey Tool for MOBEUS 2.0
 *
 * Returns industry selection options for Step 5921-A
 * 
 * Registered as window.__siteFunctions.getIndustryOptions
 * The voice agent can call this via the callSiteFunction RPC.
 */
export default function getIndustryOptions(): {
  badge: string;
  title: string;
  subtitle: string;
  generativeSubsections: Array<{
    id: string;
    templateId: string;
    props: {
      bubbles: Array<{ label: string }>;
      showProgress: boolean;
      progressStep: number;
      progressTotal: number;
    };
  }>;
} {
  return {
    badge: "MOBEUS CAREER",
    title: "Qualification",
    subtitle: "Step 1 of 3",
    generativeSubsections: [
      {
        id: "industry-select",
        templateId: "MultiSelectOptions",
        props: {
          bubbles: [
            { label: "Technology" },
            { label: "Finance" },
            { label: "Healthcare" },
            { label: "Construction" },
            { label: "Something else" },
            { label: "I'm not sure" }
          ],
          showProgress: true,
          progressStep: 0,
          progressTotal: 3
        }
      }
    ]
  };
}