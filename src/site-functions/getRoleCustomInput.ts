/**
 * getRoleCustomInput — Welcome Journey Tool for MOBEUS 2.0
 *
 * Returns custom role TextInput for Step 6100-B in navigateToSection format.
 * Shown when the user selects "Something else" at the Role step.
 *
 * Registered as window.__siteFunctions.getRoleCustomInput
 * The voice agent can call this via the callSiteFunction RPC and pass the result to navigateToSection.
 */
export default function getRoleCustomInput() {
  return {
    badge: 'MOBEUS CAREER',
    title: 'Qualification',
    subtitle: 'Step 2 of 3',
    generativeSubsections: [
      {
        id: '6100-B',
        templateId: 'TextInput',
        props: {
          placeholder: 'Type role',
        },
      },
    ],
  };
}
