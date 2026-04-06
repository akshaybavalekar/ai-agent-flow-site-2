/**
 * getIndustryCustomInput — Welcome Journey Tool for MOBEUS 2.0
 *
 * Returns custom industry input for Step 5921-B in navigateToSection format
 * 
 * Registered as window.__siteFunctions.getIndustryCustomInput
 * The voice agent can call this via the callSiteFunction RPC and pass the result to navigateToSection.
 */
export default function getIndustryCustomInput() {
  const payload = {
    badge: "MOBEUS CAREER",
    title: "Qualification",
    subtitle: "Step 1 of 3",
    generativeSubsections: [
      {
        id: "5921-B",
        templateId: "TextInput",
        props: {
          placeholder: "Type industry"
        }
      }
    ]
  };

  console.log("[getIndustryCustomInput] Returning payload:", JSON.stringify(payload, null, 2));
  return payload;
}