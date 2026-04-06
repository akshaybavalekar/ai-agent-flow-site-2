# search_knowledge — Tool Reference (trAIn)

## Purpose

Search the RAG knowledge base for trAIn's **exact payloads, option labels, and tables** (talent: welcome, qualification, dashboard, sheets; employer: job posting options, JOB_DATA format). Use when you need canonical content for a step. Do not guess — search and use the returned content.

## Signature

```typescript
search_knowledge(payload: { query: string }): KnowledgeResult[]
```

## Available knowledge sources

| Source | Content |
|--------|---------|
| trainco_welcome_payloads | Step 1–5 payloads: greeting, tell-me-more, industry, industry-text, exploration, role, role-custom, role-exploration, priority, priority-text, registration |
| trainco_qualification_options | Role options by industry; interest options by industry (append Something else · I'm not sure) |
| trainco_dashboard_payloads | Dashboard landing (ProfileSheet profile-home); JobSearchSheet, JobDetailSheet, EligibilitySheet, CloseGapSheet, JobApplicationsSheet, PastApplicationsSheet, SavedJobsStack; template IDs |
| trainco_dashboard_tables | Back navigation (From → Navigate to); job quick-action (Signal, Speech, Then) |
| trainco_canonical_phrases | Banned phrases; canonical speech (returning visitor, dashboard, profile) |
| trainco_employer | Employer flows: job posting (role, experience, location options; title rules; skills/description; JOB_DATA format) and review applicants (role options, follow-up options, candidate options, VIEW_APPLICANTS/CANDIDATE_DETAIL markers) |

## When to search

| Situation | Query example |
|-----------|----------------|
| Building Step 1 Greeting | greeting payload step 1 / start question payload |
| Building Industry step | industry step payload |
| Industry TextInput (Something else) | industry text input payload |
| Exploration (I'm not sure at Industry) | exploration payload |
| Role options for user's industry | role options technology / role options finance |
| Role options (generic, after exploration) | role options something else |
| Role TextInput (Something else) | role custom text input payload |
| Interest options (I'm not sure at Role) | interest options technology |
| Building Priority step | priority step payload |
| Priority TextInput | priority text input payload |
| Building Registration step | registration payload |
| Dashboard home (first entry, returning, or recovery) | dashboard landing payload |
| Job search sheet | JobSearchSheet payload |
| Job detail sheet | JobDetailSheet payload |
| Eligibility sheet | EligibilitySheet payload |
| Close gap sheet | CloseGapSheet payload |
| Applications sheet | JobApplicationsSheet payload |
| Saved jobs stack | SavedJobsStack payload (includes required `bubbles` labels — same pattern as welcome GlassmorphicOptions) |
| Past applications sheet | PastApplicationsSheet payload |
| Back navigation from current screen | back navigation EligibilitySheet / back navigation table |
| Job quick-action speech and next | job quick action Apply Now / job quick actions table |
| Banned or canonical phrases | banned phrases / returning visitor greeting |
| Employer: role options (Step 1) | employer job posting role options |
| Employer: experience options (Step 2) | employer job posting experience options |
| Employer: location options (Step 3) | employer job posting location options |
| Employer: title rules / JOB_DATA format | employer job posting title rules / employer JOB_DATA format |
| Employer: review applicants role options (Step 1) | employer review applicants role options |
| Employer: options after applicants view | employer review applicants follow-up options |
| Employer: options after candidate detail | employer review applicants candidate options |

## Query tips

- Short and specific: "role options finance", "priority step payload", "dashboard landing payload".
- Include step or screen name. One query per need.
- Use industry name for role/interest: "role options technology", "interest options healthcare".

## How to use results

- Use returned JSON **verbatim** for `navigateToSection`. Fill only dynamic parts (jobId, title, company, matchScore, or role/interest labels from qualification options).
- Use returned label lists **verbatim**; do not add or reorder. Append "Something else" · "I'm not sure" only when the journey step requires it.
- No results: fall back to agent-knowledge recovery (e.g. safe fallback payload).

## Rules

- Search before constructing a payload for a known step/screen. Do not invent labels.
- Journey files define *when* to show what; search_knowledge defines *what* to show (exact payload/labels).
