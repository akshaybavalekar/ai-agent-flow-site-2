/**
 * getIndustryOptions — Welcome Journey Tool for MOBEUS 2.0
 *
 * Returns industry selection options for Step 5921-A in navigateToSection format
 * 
 * Registered as window.__siteFunctions.getIndustryOptions
 * The voice agent can call this via the callSiteFunction RPC and pass the result to navigateToSection.
 */
export default function getIndustryOptions() {
  return {
    badge: "MOBEUS CAREER",
    title: "Qualification",
    subtitle: "Step 1 of 3",
    generativeSubsections: [
      {
        id: "5921-A",
        templateId: "MultiSelectOptions",
        props: {
          options: "Technology|Finance|Healthcare|Construction|Something else|I'm not sure",
          progress: { progressStep: 0, progressTotal: 3 }
        }
      }
    ]
  };
}