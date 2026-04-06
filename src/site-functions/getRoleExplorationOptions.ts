/**
 * getRoleExplorationOptions — Welcome Journey Tool for MOBEUS 2.0
 *
 * Returns exploration options for Step 6100-C in navigateToSection format.
 * Used when user selects "I'm not sure" on role, to surface interest-based prompts.
 *
 * Registered as window.__siteFunctions.getRoleExplorationOptions
 * The voice agent can call this via the callSiteFunction RPC and pass the result to navigateToSection.
 */
export default function getRoleExplorationOptions() {
  return {
    badge: 'MOBEUS CAREER',
    title: 'Exploration',
    subtitle: 'What draws you in?',
    generativeSubsections: [
      {
        id: '6100-C',
        templateId: 'GlassmorphicOptions',
        props: {
          bubbles: [
            { label: 'Working with data and numbers' },
            { label: 'Designing and building things' },
            { label: 'Leading teams and driving strategy' },
            { label: 'Solving technical problems' },
            { label: 'Helping and advising people' },
            { label: 'Creating and communicating ideas' },
          ],
        },
      },
    ],
  };
}
