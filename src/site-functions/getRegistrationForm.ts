/**
 * getRegistrationForm — Welcome Journey Tool for MOBEUS 2.0
 *
 * Returns the registration form payload for Step 8500-A in navigateToSection format.
 *
 * Registered as window.__siteFunctions.getRegistrationForm
 * The voice agent can call this via the callSiteFunction RPC and pass the result to navigateToSection.
 */
export default function getRegistrationForm() {
  const payload = {
    badge: 'MOBEUS CAREER',
    title: 'Almost there',
    subtitle: 'Create your profile',
    generativeSubsections: [
      {
        id: '8500-A',
        templateId: 'RegistrationForm',
        props: {},
      },
    ],
  };

  console.log("[getRegistrationForm] Returning payload:", JSON.stringify(payload, null, 2));
  return payload;
}
