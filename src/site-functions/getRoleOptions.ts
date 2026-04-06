/**
 * getRoleOptions — Welcome Journey Tool for MOBEUS 2.0
 *
 * Returns role selection options for Step 6100-A in navigateToSection format.
 * Role bubbles are tailored to the selected industry.
 *
 * @param args.industry - The industry selected in Step 5921-A (e.g. "Technology", "Finance")
 *
 * Registered as window.__siteFunctions.getRoleOptions
 * The voice agent can call this via the callSiteFunction RPC and pass the result to navigateToSection.
 */
export default function getRoleOptions(args: { industry?: string }) {
  const industry = (args?.industry ?? '').toLowerCase().trim();

  const roleMap: Record<string, { label: string }[]> = {
    technology: [
      { label: 'Cybersecurity' },
      { label: 'Artificial Intelligence' },
      { label: 'Digital Transformation' },
      { label: 'Data Science' },
      { label: "Something else" },
      { label: "I'm not sure" },
    ],
    finance: [
      { label: 'Investment & Banking' },
      { label: 'Accounting & Audit' },
      { label: 'Risk & Compliance' },
      { label: 'Financial Planning' },
      { label: "Something else" },
      { label: "I'm not sure" },
    ],
    healthcare: [
      { label: 'Clinical (Doctor/Nurse)' },
      { label: 'Health Administration' },
      { label: 'Pharmacy' },
      { label: 'Medical Devices' },
      { label: "Something else" },
      { label: "I'm not sure" },
    ],
    construction: [
      { label: 'Civil & Structural Engineering' },
      { label: 'Architecture' },
      { label: 'Project Management' },
      { label: 'MEP Engineering' },
      { label: "Something else" },
      { label: "I'm not sure" },
    ],
  };

  const bubbles = roleMap[industry] ?? [
    { label: 'Leadership & Strategy' },
    { label: 'Marketing & Communications' },
    { label: 'Human Resources' },
    { label: 'Operations & Logistics' },
    { label: "Something else" },
    { label: "I'm not sure" },
  ];

  return {
    badge: 'MOBEUS CAREER',
    title: 'Qualification',
    subtitle: 'Step 2 of 3',
    generativeSubsections: [
      {
        id: '6100-A',
        templateId: 'MultiSelectOptions',
        props: {
          bubbles,
          showProgress: true,
          progressStep: 1,
          progressTotal: 3,
        },
      },
    ],
  };
}
