/**
 * getPriorityOptions — Welcome Journey Tool for MOBEUS 2.0
 *
 * Returns priority selection options for Step 7200-A in navigateToSection format.
 *
 * Registered as window.__siteFunctions.getPriorityOptions
 * The voice agent can call this via the callSiteFunction RPC and pass the result to navigateToSection.
 */
export default function getPriorityOptions() {
  return {
    badge: 'MOBEUS CAREER',
    title: 'Priorities',
    subtitle: 'Step 3 of 3',
    generativeSubsections: [
      {
        id: '7200-A',
        templateId: 'MultiSelectOptions',
        props: {
          bubbles: [
            { label: 'Searching and browsing listings' },
            { label: 'Experience and personality fit' },
            { label: 'Location' },
            { label: 'Know which skills are required' },
            { label: 'Take courses and earn certifications' },
            { label: 'Something else' },
          ],
          showProgress: true,
          progressStep: 2,
          progressTotal: 3,
        },
      },
    ],
  };
}
