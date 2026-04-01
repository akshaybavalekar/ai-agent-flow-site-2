/**
 * setTheme — Welcome Journey Tool for MOBEUS 2.0
 *
 * @param args.sectionId - Section ID to retrieve
 * @param args.customIndustry - Custom industry for dynamic generation
 *
 * Registered as window.__siteFunctions.setTheme
 * The voice agent can call this via the callSiteFunction RPC.
 */
export default function setTheme(args: { sectionId: string; customIndustry?: string }): {
  id: string;
  componentType: 'GlassmorphicOptions' | 'MultiSelectOptions' | 'TextInput' | 'RegistrationForm';
  options?: string;
  badge: string;
  title: string;
  subtitle: string;
  progress?: { progressStep: number; progressTotal: number };
  placeholder?: string;
  error?: string;
} {
  const { sectionId, customIndustry } = args;

  // All static sections with complete data
  const sections: Record<string, any> = {
    "2194-A": { componentType: "GlassmorphicOptions", options: "Yes, I'm ready|Not just yet|Tell me more", badge: "MOBEUS CAREER", title: "Welcome", subtitle: "Getting started" },
    "2194-B": { componentType: "GlassmorphicOptions", options: "How does TrAIn work?|How is TrAIn different?|Can I build skills on TrAIn?|Which jobs can I find on TrAIn?|How does TrAIn use my data?|Something else", badge: "MOBEUS CAREER", title: "Welcome", subtitle: "About TrAIn" },
    "7483-A": { componentType: "MultiSelectOptions", options: "Technology|Finance|Healthcare|Construction|Something else|I'm not sure", badge: "MOBEUS CAREER", title: "Qualification", subtitle: "Step 1 of 3", progress: { progressStep: 0, progressTotal: 3 } },
    "7483-B": { componentType: "TextInput", placeholder: "Type industry", badge: "MOBEUS CAREER", title: "Qualification", subtitle: "Step 1 of 3" },
    "7483-C": { componentType: "MultiSelectOptions", options: "Solving a puzzle or problem|Creating something from scratch|Helping someone through a tough moment|Organising chaos into order|Learning something completely new|Leading a group", badge: "MOBEUS CAREER", title: "Exploration", subtitle: "Tell us what you enjoy" },
    "4521-A": { componentType: "MultiSelectOptions", options: "Cybersecurity|Artificial Intelligence|Digital Transformation|Data Science|Something else|I'm not sure", badge: "MOBEUS CAREER", title: "Qualification", subtitle: "Step 2 of 3", progress: { progressStep: 1, progressTotal: 3 } },
    "4521-B": { componentType: "MultiSelectOptions", options: "Investment & Banking|Accounting & Audit|Risk & Compliance|Financial Planning|Something else|I'm not sure", badge: "MOBEUS CAREER", title: "Qualification", subtitle: "Step 2 of 3", progress: { progressStep: 1, progressTotal: 3 } },
    "4521-C": { componentType: "MultiSelectOptions", options: "Clinical (Doctor/Nurse)|Health Administration|Pharmacy|Medical Devices|Something else|I'm not sure", badge: "MOBEUS CAREER", title: "Qualification", subtitle: "Step 2 of 3", progress: { progressStep: 1, progressTotal: 3 } },
    "4521-D": { componentType: "MultiSelectOptions", options: "Civil & Structural Engineering|Architecture|Project Management|MEP Engineering|Something else|I'm not sure", badge: "MOBEUS CAREER", title: "Qualification", subtitle: "Step 2 of 3", progress: { progressStep: 1, progressTotal: 3 } },
    "4521-F": { componentType: "MultiSelectOptions", options: "Leadership & Strategy|Marketing & Communications|Human Resources|Operations & Logistics|Something else|I'm not sure", badge: "MOBEUS CAREER", title: "Qualification", subtitle: "Step 2 of 3", progress: { progressStep: 1, progressTotal: 3 } },
    "4521-G": { componentType: "TextInput", placeholder: "Type role", badge: "MOBEUS CAREER", title: "Qualification", subtitle: "Step 2 of 3" },
    "4521-H": { componentType: "MultiSelectOptions", options: "Solving complex logic puzzles|Finding patterns in data|Leading teams to launch products|Designing easy to use interfaces|Leading teams towards a goal|Something else|I'm not sure", badge: "MOBEUS CAREER", title: "Role Exploration", subtitle: "What interests you?" },
    "4521-I": { componentType: "MultiSelectOptions", options: "Managing and analysing data|Identifying risks and mitigations|Building client relationships|Strategising investments|Leading financial teams|Something else|I'm not sure", badge: "MOBEUS CAREER", title: "Role Exploration", subtitle: "What interests you?" },
    "4521-J": { componentType: "MultiSelectOptions", options: "Caring for people directly|Analysing patient data|Managing healthcare operations|Developing new treatments|Leading medical teams|Something else|I'm not sure", badge: "MOBEUS CAREER", title: "Role Exploration", subtitle: "What interests you?" },
    "4521-K": { componentType: "MultiSelectOptions", options: "Designing structures and spaces|Managing complex projects|Solving engineering challenges|Coordinating large teams|Working with innovative materials|Something else|I'm not sure", badge: "MOBEUS CAREER", title: "Role Exploration", subtitle: "What interests you?" },
    "1657-A": { componentType: "MultiSelectOptions", options: "Searching and browsing listings|Experience and personality fit|Location|Know which skills are required|Take courses and earn certifications|Something else", badge: "MOBEUS CAREER", title: "Priorities", subtitle: "Step 3 of 3", progress: { progressStep: 2, progressTotal: 3 } },
    "1657-B": { componentType: "TextInput", placeholder: "Type what matters most", badge: "MOBEUS CAREER", title: "Priorities", subtitle: "Step 3 of 3" },
    "9183-A": { componentType: "RegistrationForm", badge: "MOBEUS CAREER", title: "Registration", subtitle: "Create your account" }
  };

  // Generate dynamic roles for custom industries
  function getDynamicRoles(industry: string): string {
    const mappings: Record<string, string[]> = {
      "renewable energy": ["Solar Energy Engineering", "Wind Power Specialist", "Energy Storage Solutions", "Sustainability Consulting"],
      "gaming": ["Game Design", "Game Development", "Esports Management", "Game Production"],
      "agriculture": ["Agricultural Engineering", "Farm Management", "Agricultural Research", "Sustainable Farming"],
      "fashion": ["Fashion Design", "Fashion Marketing", "Retail Management", "Textile Engineering"],
      "biotechnology": ["Biotech Research", "Clinical Development", "Regulatory Affairs", "Bioinformatics"]
    };
    
    const key = industry.toLowerCase().trim();
    const roles = mappings[key] || [`${industry} Specialist`, `${industry} Operations`, `${industry} Management`, `${industry} Development`];
    return roles.join("|") + "|Something else|I'm not sure";
  }

  // Handle dynamic section 4521-E
  if (sectionId === "4521-E") {
    if (!customIndustry) {
      return { id: sectionId, componentType: "MultiSelectOptions", badge: "MOBEUS CAREER", title: "Qualification", subtitle: "Step 2 of 3", progress: { progressStep: 1, progressTotal: 3 }, error: "customIndustry required" };
    }
    return { id: sectionId, componentType: "MultiSelectOptions", options: getDynamicRoles(customIndustry), badge: "MOBEUS CAREER", title: "Qualification", subtitle: "Step 2 of 3", progress: { progressStep: 1, progressTotal: 3 } };
  }

  // Handle static sections
  const section = sections[sectionId];
  if (!section) {
    return { id: sectionId, componentType: "GlassmorphicOptions", badge: "MOBEUS CAREER", title: "Error", subtitle: "Unknown section", error: `Unknown section ID: ${sectionId}` };
  }

  return { id: sectionId, ...section };
}
