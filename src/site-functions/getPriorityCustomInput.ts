/**
 * getPriorityCustomInput — Welcome Journey Tool for MOBEUS 2.0
 *
 * Returns custom priority text input for Step 7200-B in navigateToSection format.
 *
 * Registered as window.__siteFunctions.getPriorityCustomInput
 * The voice agent can call this via the callSiteFunction RPC and pass the result to navigateToSection.
 */
export default function getPriorityCustomInput() {
  return {
    badge: 'MOBEUS CAREER',
    title: 'Qualification',
    subtitle: 'Step 3 of 3',
    generativeSubsections: [
      {
        id: '7200-B',
        templateId: 'TextInput',
        props: {
          placeholder: 'What matters most to you?',
        },
      },
    ],
  };
}
