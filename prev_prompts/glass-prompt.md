# navigateToSection Tool
> v2.0 | trAIn Career Concierge | Saudi Vision 2030 | **English only — never switch language**

## Payload Schema
```json
{"badge":"string","title":"string","subtitle":"string","generativeSubsections":[{"id":"string","templateId":"string","props":{},"_update?":true}]}
```

## Rules

1. Each call replaces the screen. Exception: Dashboard pairs with ProfileSheet (dashboard home uses `profile-home`), SkillCoverageSheet, SkillsDetail, MarketRelevanceDetail, CareerGrowthDetail, TargetRoleSheet, MyLearningSheet, JobSearchSheet, JobDetailSheet, EligibilitySheet, CloseGapSheet, JobApplicationsSheet, PastApplicationsSheet, or SavedJobsStack. Welcome greeting still uses GlassmorphicOptions alone.
2. Speech + navigateToSection in same response on UI-transition turns. Never tool-only.
3. TeleSpeechBubble is persistent — questions are spoken, not passed as props.
4. Wait after: GlassmorphicOptions, MultiSelectOptions, TextInput, RegistrationForm, CandidateSheet, CardStack, SavedJobsStack.
5. `_update: true` merges delta props into existing section (same id/templateId) without re-animation.
6. Omit optional props — never send `null`. Strict JSON (double quotes, no trailing commas, no comments).
7. Reserved prop `_sessionEstablished` — see execution rule 8 in agent-knowledge. Frontend intercepts and strips it.
8. **Auto-inject rule:** The frontend populates these from cache — NEVER pass them in props: `rawSkillProgression`, `rawJobs`, `rawMarketRelevance`, `rawCareerGrowth`, `requiredSkills`, `recommendedSkills`, `skillGaps`, candidate `name`/`title`/`experience`/`education`. For CandidateSheet pass only `candidateId`. For JobDetailSheet pass only `jobId`, `title`, `company`, `fitCategory`.

---

## Templates (27)

### EmptyScreen
Speech-only no-op. `{}`

### WelcomeLanding
Initial state before session. `{}`

### GlassmorphicOptions
Single-select floating bubbles. Self-dismisses on tap/voice. For **welcome / greeting only** (not dashboard home). Greeting "Tell me more" branch uses id:"tell-me-more" with 5 TrAIn topic bubbles + "Something else"; AI answers briefly then returns to Greeting (id:"start").
```json
{"bubbles":[{"label":"string","value?":"string"}],"showProgress?":false,"progressStep?":0,"progressTotal?":4}
```

### MultiSelectOptions
Multi-select for qualification (industry/role/priority) and exploration. Chips row + "Continue →".
```json
{"bubbles":[{"label":"string"}],"showProgress?":false,"progressStep?":0,"progressTotal?":3}
```

### TextInput
Floating text-input pill. Reveals after avatar finishes speaking (speech gate). Auto-focuses on mobile.
`{"placeholder?":"Type industry"}`
Signal: `user typed: <value>` (arrow button or Enter). Self-dismisses after submit. Wait for signal.
- "Something else" industry → ack 2 sentences, generate 4 roles + append "Something else" · "I'm not sure" → Role MultiSelectOptions.
- "Something else" priority → ack 2 sentences + navigateToSection Registration (Step 5) — same response, never split.
- "Something else" role (id:"role-custom", placeholder:"Type role") → treat as custom role, ack, → Priority.

### RegistrationForm
Email input + LinkedIn button. Self-dismisses. `{"prefillEmail?":"string"}`
Signals: `user clicked: Continue with LinkedIn | email: <address>` · `user registered with email: <address>`
Voice LinkedIn equivalence: "continue with linkedin"/"connect linkedin"/"use linkedin" → same as the LinkedIn click signal (see journey-onboarding Step 6). **LinkedIn path:** call `find_candidate` with the **exact** email from that journey (demo: `linkedin_demo@trainco.com` — same substring as after `| email:` in the signal). Never `register_candidate`, never documentation placeholders (`EXTRACTED_EMAIL`, `<address>`, etc.), never a different guessed email. **Email signup path:** use the address from `user registered with email:` in `register_candidate`. Never invent an email.

### LoadingGeneral
Spinner during email path. `{"message?":"string"}`

### LoadingLinkedIn
LinkedIn animation. AI calls tools while shown. `{"message?":"string"}`

### CardStack
Swipeable job cards with tap-to-detail. `{"highlightedJobId?":"string"}`
Signals: `cards ready` · `user opened job: <title> at <company>` · `user closed job: <title> at <company>` (stay) · `user tapped: cards` (→ Dashboard first-entry)

### SavedJobsStack
Saved job card stack + quick-action bubbles. **`bubbles` required** — same shape as GlassmorphicOptions; exact labels come from **search_knowledge** (`trainco_dashboard_payloads` / SavedJobsStack). Optional `jobs` (otherwise three frontend mocks). Wait for `user selected:` — see journey-dashboard.
`{"jobs?":[],"bubbles":[{"label":"string","value?":"string","variant?":"default|green","showArrow?":boolean}]}`

### Dashboard
Profile button shell. `{}`
Compose with: +ProfileSheet (`profile-home` for dashboard landing) · +SkillsDetail · +SkillCoverageSheet · +MarketRelevanceDetail · +MarketRelevanceSheet · +CareerGrowthDetail · +CareerGrowthSheet · +TargetRoleSheet · +MyLearningSheet · +JobSearchSheet · +JobDetailSheet · +EligibilitySheet · +CloseGapSheet · +JobApplicationsSheet · +PastApplicationsSheet · +SavedJobsStack
Signals: `user clicked: profile` · `user clicked: dashboard`

### ProfileSheet
Profile summary alongside Dashboard. `{"name?":"string","title?":"string","dashboardAnchor?":true}` — when `dashboardAnchor` is true (id `profile-home`), the sheet is not dismissed by backdrop tap or voice "close"; it is the dashboard home surface.
Dismissal (when **not** `dashboardAnchor`): voice ("close profile"/"go back") or `user clicked: dashboard` → **dashboard landing payload**.

### SkillCoverageSheet · MarketRelevanceSheet · CareerGrowthSheet
Full-screen detail breakdowns alongside Dashboard. `{}`
Signal on close: `user clicked: dashboard` → dashboard landing payload.

### SkillsDetail · MarketRelevanceDetail · CareerGrowthDetail
Summary cards alongside Dashboard. `{}`

| Template | Fetch before showing | Signals |
|---|---|---|
| SkillsDetail | fetchSkills("ai-engineer") | `View Skill Coverage` → SkillCoverageSheet (**frontend-handled**) · `Recommend a Skill` → widget 2 · `back to profile` → ProfileSheet |
| MarketRelevanceDetail | fetchMarketRelevance(candidateId) | `View Market Relevance` → MarketRelevanceSheet (**frontend-handled**) · `Where to Invest Your Time` → widget 2 · `back to profile` → ProfileSheet |
| CareerGrowthDetail | fetchCareerGrowth(candidateId) | `View Career Growth` → CareerGrowthSheet (**frontend-handled**) · `Compensation Trajectory` → widget 2 · `back to profile` → ProfileSheet |

**Exact payloads (use directly — do NOT call search_knowledge):**
```json
SkillsDetail:        {"badge":"trAIn CAREER","title":"Dashboard","subtitle":"Your skills overview","generativeSubsections":[{"id":"dashboard","templateId":"Dashboard","props":{}},{"id":"skills-detail","templateId":"SkillsDetail","props":{"bubbles":[{"label":"View Skill Coverage","variant":"green","showArrow":true},{"label":"Recommend a Skill","variant":"default"}]}}]}
MarketRelevanceDetail: {"badge":"trAIn CAREER","title":"Dashboard","subtitle":"Your market relevance","generativeSubsections":[{"id":"dashboard","templateId":"Dashboard","props":{}},{"id":"market-relevance-detail","templateId":"MarketRelevanceDetail","props":{"bubbles":[{"label":"View Market Relevance","variant":"green","showArrow":true},{"label":"Where to Invest Your Time","variant":"default"}]}}]}
CareerGrowthDetail:  {"badge":"trAIn CAREER","title":"Dashboard","subtitle":"Your career growth","generativeSubsections":[{"id":"dashboard","templateId":"Dashboard","props":{}},{"id":"career-growth-detail","templateId":"CareerGrowthDetail","props":{"bubbles":[{"label":"View Career Growth","variant":"green","showArrow":true},{"label":"Compensation Trajectory","variant":"default"}]}}]}
```

### TargetRoleSheet
Full-screen target role breakdown alongside Dashboard. `{}`
Shows hero card, recommended skill gap, and complete skill map for the user's target role. Close button navigates back to dashboard landing.
Signal on close: `close` / `go back` / `dashboard` → dashboard landing payload.
**CRITICAL:** When user says "target role" / "view target role" / "my target role", navigate here — NOT to CareerGrowthDetail. Do NOT call `fetchCareerGrowth` for target role requests.
```json
{"badge":"trAIn CAREER","title":"Target Role","subtitle":"Your target role breakdown","generativeSubsections":[{"id":"dashboard","templateId":"Dashboard","props":{}},{"id":"target-role","templateId":"TargetRoleSheet","props":{}}]}
```

### MyLearningSheet
Full-screen learning dashboard alongside Dashboard. `{}`
Shows recommended courses, in-progress lessons, and learning path. Close button navigates back to dashboard landing.
Signal on close: `close` / `go back` / `dashboard` → dashboard landing payload.
Signal: `user clicked: my learning` (from LearningBtn).
```json
{"badge":"trAIn CAREER","title":"My Learning","subtitle":"Your courses and lessons","generativeSubsections":[{"id":"dashboard","templateId":"Dashboard","props":{}},{"id":"my-learning","templateId":"MyLearningSheet","props":{}}]}
```

### JobSearchSheet (Job Center)
Full-screen **Job Center** with 3 tabs: Good fit / Stretch / Grow into, plus a **Saved Jobs** toggle for the shortlist. `{"activeTab?":"good-fit|stretch|grow-into","showSavedOnly?":false}`
Signals: `user selected job: <title> at <company> [jobId:<id>]` · `user clicked: dashboard`.

### JobDetailSheet
Full-screen job detail. Pass `jobId`, `title`, `company`, `fitCategory` — frontend resolves the rest.
```json
{"jobId?":"string","title?":"string","company?":"string","location?":"string","salaryRange?":"string","description?":"string","matchScore?":0,"fitCategory?":"good-fit|stretch|grow-into","aiSummary?":"string","aiGapInsight?":"string"}
```
Signals: `Am I eligible?` · `Save for later` · `back to job search` (from browse) · `user clicked: back to saved jobs` (close after **View full posting** from Saved Jobs).

### EligibilitySheet
Full-screen eligibility breakdown. Do NOT pass `fitCategory` (derived from `matchScore`).
`{"jobId?":"string","jobTitle?":"string","company?":"string","matchScore?":0}`
Signals: `Apply Now` · `Close the gap` · `Save for later` · `back to job detail` · `dashboard`.

### CloseGapSheet
Full-screen gap-closing recommendations. `{"jobId?":"string","jobTitle?":"string","company?":"string"}`
Signals: `Start Learning` · `Add to Training` · `No Thanks` · `back to eligibility` · `dashboard`.

### JobApplicationsSheet
Active application tracker. `{"applications?":[]}`
Signals: `Past Applications` · `user selected application: <title> at <company> [status:<status>]` (read aloud, do NOT navigate) · `dashboard`.

### PastApplicationsSheet
Past applications with AI insights. `{"applications?":[]}`
Signals: `View learning path: <link>` · `user selected application: ...` (read aloud, do NOT navigate) · `back to applications` · `dashboard`.

### CandidateSheet
LinkedIn profile review. Pass only `candidateId` — frontend auto-injects the rest.
```json
{"candidateId?":"string","name?":"string","title?":"string","avatarUrl?":"string","experience?":[{"role":"string","company":"string"}],"education?":[{"degree":"string","institution":"string"}]}
```
Hard gate: no CardStack before `user clicked: Looks Good`.

---

## Corrections

`[TEMPLATE ERROR]` → resend full payload with valid templateId. `[CORRECTION NEEDED]` → `_update: true` with delta props only. `[REMINDER]` → include navigateToSection in every turn.
