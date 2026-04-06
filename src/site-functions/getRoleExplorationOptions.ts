/**
 * getRoleExplorationOptions — Welcome Journey Tool for MOBEUS 2.0
 *
 * Returns interest-based exploration options for Step 6100-C in navigateToSection format.
 * Shown when the user selects "I'm not sure" at the Role step.
 * Interest bubbles are tailored to the selected industry.
 *
 * @param args.industry - The industry selected in Step 5921-A (e.g. "Technology", "Finance")
 *
 * Registered as window.__siteFunctions.getRoleExplorationOptions
 * The voice agent can call this via the callSiteFunction RPC and pass the result to navigateToSection.
 */
export default function getRoleExplorationOptions(args: { industry?: string }) {
  const industry = (args?.industry ?? '').toLowerCase().trim();

  const interestMap: Record<string, { label: string }[]> = {
    technology: [
      { label: 'Solving complex logic puzzles' },
      { label: 'Finding patterns in data' },
      { label: 'Leading teams to launch products' },
      { label: 'Designing easy to use interfaces' },
      { label: 'Leading teams towards a goal' },
      { label: "Something else" },
      { label: "I'm not sure" },
    ],
    finance: [
      { label: 'Managing and analysing data' },
      { label: 'Identifying risks and mitigations' },
      { label: 'Building client relationships' },
      { label: 'Strategising investments' },
      { label: 'Leading financial teams' },
      { label: "Something else" },
      { label: "I'm not sure" },
    ],
    healthcare: [
      { label: 'Caring for people directly' },
      { label: 'Analysing patient data' },
      { label: 'Managing healthcare operations' },
      { label: 'Developing new treatments' },
      { label: 'Leading medical teams' },
      { label: "Something else" },
      { label: "I'm not sure" },
    ],
    construction: [
      { label: 'Designing structures and spaces' },
      { label: 'Managing complex projects' },
      { label: 'Solving engineering challenges' },
      { label: 'Coordinating large teams' },
      { label: 'Working with innovative materials' },
      { label: "Something else" },
      { label: "I'm not sure" },
    ],
  };

  const bubbles = interestMap[industry] ?? [
    { label: 'Solving a puzzle or problem' },
    { label: 'Creating something from scratch' },
    { label: 'Helping someone through a tough moment' },
    { label: 'Organising chaos into order' },
    { label: 'Learning something completely new' },
    { label: 'Leading a group' },
    { label: "Something else" },
    { label: "I'm not sure" },
  ];

  return {
    badge: 'MOBEUS CAREER',
    title: 'Role Exploration',
    subtitle: 'What interests you?',
    generativeSubsections: [
      {
        id: '6100-C',
        templateId: 'MultiSelectOptions',
        props: { bubbles },
      },
    ],
  };
}
