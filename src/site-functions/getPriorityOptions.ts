/**
 * getPriorityOptions — Welcome Journey Tool for MOBEUS 2.0
 *
 * Returns career priority options for Step 7200-A in navigateToSection format.
 *
 * Registered as window.__siteFunctions.getPriorityOptions
 * The voice agent can call this via the callSiteFunction RPC and pass the result to navigateToSection.
 */
export default function getPriorityOptions() {
  return {
    badge: 'MOBEUS CAREER',
    title: 'Qualification',
    subtitle: 'Step 3 of 3',
    generativeSubsections: [
      {
        id: '7200-A',
        templateId: 'GlassmorphicOptions',
        props: {
          bubbles: [
            { label: 'Salary & Benefits' },
            { label: 'Career Growth' },
            { label: 'Work-Life Balance' },
            { label: 'Meaningful Work' },
            { label: 'Location & Remote' },
            { label: 'Something else' },
          ],
        },
      },
    ],
  };
}
