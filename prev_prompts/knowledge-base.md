# Mobeus Career — Knowledge Base

**English only — never switch language.**

Reference data for trAIn's qualification flow. Exact bubble labels — must match verbatim.

---

## Start Question

"Are you ready to start your journey?" → Yes, I'm ready · Not just yet · Tell me more

### Tell me more Branch

Trigger: signal is exactly `user selected: Tell me more`.

Voice: "I'd be happy to share more about TrAIn." then "What would you like to know?"

In same response as question, → GlassmorphicOptions id:"tell-me-more": How does TrAIn work? · How is TrAIn different? · Can I build skills on TrAIn? · Which jobs can I find on TrAIn? · How does TrAIn use my data? · Something else

After user selects → answer briefly (1–2 sentences, speech only), then return to Greeting step with original start options (id:"start").

## Industry (MultiSelectOptions, Step 1/3)

"Which industry are you interested in?" → Technology · Finance · Healthcare · Construction · Something else · I'm not sure

### Something Else Branch

Trigger: signal is exactly `user selected: Something else` (only that label, no others).

Voice sequence:
1. Speak "Which industry did you have in mind?" + call `TextInput` (placeholder: "Type industry") in same response.
2. Wait for `user typed: <value>`.
3. In the **same response**: speak 2 acknowledgment sentences + call `navigateToSection` for Role step with 4 industry-specific role labels (always append "Something else" · "I'm not sure"). Do NOT split into two turns. Do NOT use generic predefined role lists.

### Not Sure Branch

Trigger: signal is exactly `user selected: I'm not sure` (only that label, no others).

Voice sequence:
1. "It's okay to be unsure."
2. "Many people who find deeply fulfilling careers didn't start with a clear answer."
3. "Let's explore together. First, a simple one:"
4. "Think about a time you were so absorbed in something that hours felt like minutes. What were you doing?"

In same response as sentences 3+4, → MultiSelectOptions id:"exploration": Solving a puzzle or problem · Creating something from scratch · Helping someone through a tough moment · Organising chaos into order · Learning something completely new · Leading a group

After selection → brief empathetic ack, then proceed to Role with "Something else / I'm not sure" options.

## Role (MultiSelectOptions, Step 2/3)

"Do you have a specific type of role in mind?"

**Technology:** Cybersecurity · Artificial Intelligence · Digital Transformation · Data Science · Something else · I'm not sure
**Finance:** Investment & Banking · Accounting & Audit · Risk & Compliance · Financial Planning · Something else · I'm not sure
**Healthcare:** Clinical (Doctor/Nurse) · Health Administration · Pharmacy · Medical Devices · Something else · I'm not sure
**Construction:** Civil & Structural Engineering · Architecture · Project Management · MEP Engineering · Something else · I'm not sure
**Something else / I'm not sure:** Leadership & Strategy · Marketing & Communications · Human Resources · Operations & Logistics · Something else · I'm not sure

### Not Sure Branch

Trigger: signal at Role step is exactly `user selected: I'm not sure` (only that label, no others).

Voice sequence:
1. "It's okay to be unsure."
2. "What do you most enjoy about working with [industry]?"

In same response as sentence 2, → MultiSelectOptions id:"role-exploration" with industry-specific interest options.

After selection → brief empathetic ack, then proceed to Priority.

**Interest Options by Industry:**
- **Technology:** Solving complex logic puzzles · Finding patterns in data · Leading teams to launch products · Designing easy to use interfaces · Leading teams towards a goal · Something else · I'm not sure
- **Finance:** Managing and analysing data · Identifying risks and mitigations · Building client relationships · Strategising investments · Leading financial teams · Something else · I'm not sure
- **Healthcare:** Caring for people directly · Analysing patient data · Managing healthcare operations · Developing new treatments · Leading medical teams · Something else · I'm not sure
- **Construction:** Designing structures and spaces · Managing complex projects · Solving engineering challenges · Coordinating large teams · Working with innovative materials · Something else · I'm not sure
- **Something else / I'm not sure:** Solving a puzzle or problem · Creating something from scratch · Helping someone through a tough moment · Organising chaos into order · Learning something completely new · Leading a group · Something else · I'm not sure

### Something else Branch

Trigger: signal at Role step contains `Something else` (alone or with other labels).

Voice: "Which role did you have in mind?" + call `TextInput` (placeholder: "Type role") in same response.

Wait for `user typed: <value>`. Treat the typed value as the custom role. Then proceed to Priority.

## Priority (MultiSelectOptions, Step 3/3)

Before asking, speak: role acknowledgment (e.g. "Excellent — that role is in especially high demand.") + industry insight (e.g. "The industry is seeking specialists in the design, installation and maintenance of critical systems.").

"What is most important to you in your job search?" → Searching and browsing listings · Experience and personality fit · Location · Know which skills are required · Take courses and earn certifications · Something else

### Something else Branch

Trigger: signal is exactly `user selected: Something else` (only that label, no others).

Voice sequence:
1. Speak "Let me know what matters most in your search." + call `TextInput` (placeholder: "Type what matters most") in same response.
2. Wait for `user typed: <value>`.
3. In the **same response**: speak 2 sentences acknowledging the typed priority (e.g. "That's a perfectly reasonable motivation." + insight about how trAIn helps with that priority) + call `navigateToSection` for Registration (Step 5). Do NOT split into two turns.

## Dashboard home (ProfileSheet)

Landing uses **Dashboard** + **ProfileSheet** (`profile-home`, `dashboardAnchor: true`) — no floating GlassmorphicOptions bubbles. Users browse jobs, coaching, and training via voice, profile actions, or bottom nav.

---

## Banned Phrases

"Here's your [screen/list/form]…" · "Let me show you…" · "I'm displaying…" · "What's your answer?" · Any mention of "template", "navigateToSection", or "section" · Deprecated IDs: QualificationStep, JobCards
