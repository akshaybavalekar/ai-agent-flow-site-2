/**
 * getRegistrationForm — Welcome Journey Tool for MOBEUS 2.0
 *
 * Returns the RegistrationForm payload for Step 8500-A in navigateToSection format.
 * This is the final step of the welcome journey before onboarding handoff.
 *
 * Registered as window.__siteFunctions.getRegistrationForm
 * The voice agent can call this via the callSiteFunction RPC and pass the result to navigateToSection.
 */
export default function getRegistrationForm() {
  return {
    badge: 'MOBEUS CAREER',
    title: 'Registration',
    subtitle: 'Create your account',
    generativeSubsections: [
      {
        id: '8500-A',
        templateId: 'RegistrationForm',
        props: {},
      },
    ],
  };
}
