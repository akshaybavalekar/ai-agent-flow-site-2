/**
 * getIndustryCustomInput — Welcome Journey Tool for MOBEUS 2.0
 *
 * Returns custom industry input for Step 5921-B
 * 
 * Registered as window.__siteFunctions.getIndustryCustomInput
 * The voice agent can call this via the callSiteFunction RPC.
 */
export default function getIndustryCustomInput(): {
  badge: string;
  title: string;
  subtitle: string;
  generativeSubsections: Array<{
    id: string;
    templateId: string;
    props: {
      placeholder: string;
    };
  }>;
} {
  return {
    badge: "MOBEUS CAREER",
    title: "Qualification",
    subtitle: "Step 1 of 3",
    generativeSubsections: [
      {
        id: "industry-custom",
        templateId: "TextInput",
        props: {
          placeholder: "Type industry"
        }
      }
    ]
  };
}