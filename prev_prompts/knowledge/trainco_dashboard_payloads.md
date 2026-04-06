# trAIn — Dashboard & sheet payloads

Exact navigateToSection payloads for journey-dashboard. Fill jobId, title, company, matchScore where indicated.

## Dashboard landing (all entries: first visit, returning, or any time you return to dashboard home)

Always **Dashboard** + **ProfileSheet** with id `profile-home` and `props.dashboardAnchor: true`. The frontend injects candidate name, avatar, and skills from cache — you may omit `name` or use a placeholder; do **not** add GlassmorphicOptions begin-cta bubbles.

```json
{"badge":"trAIn CAREER","title":"Dashboard","subtitle":"Your Profile","generativeSubsections":[{"id":"dashboard","templateId":"Dashboard","props":{}},{"id":"profile-home","templateId":"ProfileSheet","props":{"dashboardAnchor":true}}]}
```

## JobSearchSheet (Job Center UI)

```json
{"badge":"trAIn CAREER","title":"Job Center","subtitle":"Find your next job here","generativeSubsections":[{"id":"dashboard","templateId":"Dashboard","props":{}},{"id":"job-search","templateId":"JobSearchSheet","props":{}}]}
```

Optional props: `activeTab` ("good-fit" | "stretch" | "grow-into"). `showSavedOnly` (boolean): when `true`, opens with the **Saved Jobs** filter on (shortlist only). **Do not** set `showSavedOnly` when navigating from **Find more jobs** or **View all saved jobs** — the user should land on full Job Center (all matches, toggle off).

## JobDetailSheet

```json
{"badge":"trAIn CAREER","title":"Job Detail","subtitle":"<title>","generativeSubsections":[{"id":"dashboard","templateId":"Dashboard","props":{}},{"id":"job-detail","templateId":"JobDetailSheet","props":{"jobId":"<id>","title":"<title>","company":"<company>","fitCategory":"good-fit|stretch|grow-into"}}]}
```

Fill jobId, title, company, fitCategory from signal or cache.

## EligibilitySheet

```json
{"badge":"trAIn CAREER","title":"Eligibility","subtitle":"Am I eligible?","generativeSubsections":[{"id":"dashboard","templateId":"Dashboard","props":{}},{"id":"eligibility","templateId":"EligibilitySheet","props":{"jobId":"<id>","jobTitle":"<title>","company":"<company>","matchScore":"<actual numeric score from cached job, e.g. 82>"}}]}
```

Fill jobId, jobTitle, company, matchScore from cached job.

## CloseGapSheet

```json
{"badge":"trAIn CAREER","title":"Close the Gap","subtitle":"Bridge your skill gaps","generativeSubsections":[{"id":"dashboard","templateId":"Dashboard","props":{}},{"id":"close-gap","templateId":"CloseGapSheet","props":{"jobId":"<id>","jobTitle":"<title>","company":"<company>"}}]}
```

## JobApplicationsSheet

```json
{"badge":"trAIn CAREER","title":"Applications","subtitle":"Track your progress","generativeSubsections":[{"id":"dashboard","templateId":"Dashboard","props":{}},{"id":"applications","templateId":"JobApplicationsSheet","props":{}}]}
```

## SavedJobsStack (Profile → Saved Jobs)

Compose with **Dashboard**. **Required:** `bubbles` — same shape as **GlassmorphicOptions** (`label`, optional `value`, `variant` `"default"|"green"`, optional `showArrow`). Labels are **not** hardcoded in the app; copy this JSON verbatim from search (or update here when product changes). Three frontend-mocked jobs are used when `jobs` is omitted.

```json
{"badge":"trAIn CAREER","title":"Saved Jobs","subtitle":"Your shortlist","generativeSubsections":[{"id":"dashboard","templateId":"Dashboard","props":{}},{"id":"saved-jobs","templateId":"SavedJobsStack","props":{"bubbles":[{"label":"View full posting","variant":"default"},{"label":"Am I eligible?","variant":"green","showArrow":true},{"label":"Find more jobs","variant":"default"},{"label":"View all saved jobs","variant":"default"}]}}]}
```

**Do not** call `navigateToSection` without `bubbles` — DynamicSectionLoader will request a correction (same pattern as greeting **GlassmorphicOptions**).

## PastApplicationsSheet

```json
{"badge":"trAIn CAREER","title":"Past Applications","subtitle":"Previous outcomes","generativeSubsections":[{"id":"dashboard","templateId":"Dashboard","props":{}},{"id":"past-apps","templateId":"PastApplicationsSheet","props":{}}]}
```

## SkillsDetail (for "Skill Coverage" from ProfileSheet — NOT SkillCoverageSheet)

From ProfileSheet, ALWAYS navigate to SkillsDetail. NEVER navigate to SkillCoverageSheet directly — it is a child view reached via SkillsDetail bubbles.

**Initial navigation payload** (must include `bubbles`):
```json
{"badge":"trAIn CAREER","title":"Dashboard","subtitle":"Your skills overview","generativeSubsections":[{"id":"dashboard","templateId":"Dashboard","props":{}},{"id":"skills-detail","templateId":"SkillsDetail","props":{"bubbles":[{"label":"View Skill Coverage","variant":"green","showArrow":true},{"label":"Recommend a Skill","variant":"default"}]}}]}
```

**Widget transition payload** (for "Recommend a Skill"):
```json
{"badge":"trAIn CAREER","title":"Dashboard","subtitle":"Your skills overview","generativeSubsections":[{"id":"dashboard","templateId":"Dashboard","props":{}},{"id":"skills-detail","templateId":"SkillsDetail","props":{"_triggerWidget":2},"_update":true}]}
```

Frontend auto-injects skill data from cache. SkillsDetail has 2 widgets with bubbles:
- Widget 1: gauge + recommendations + 2 bubbles ("View Skill Coverage", "Recommend a Skill")
- Widget 2: detailed recommendations + 1 bubble ("View Skill Coverage")

Both "View Skill Coverage" bubbles navigate to SkillCoverageSheet via frontend-handled navigation (same pattern as MarketRelevanceDetail).

## MarketRelevanceDetail (for "Market Relevance" from ProfileSheet — NOT MarketRelevanceSheet)

From ProfileSheet, navigate to MarketRelevanceDetail with bubbles. Widget 1 shows gauge + insight + 2 bubble options initially. User selects bubble to navigate or toggle widget.

```json
{"badge":"trAIn CAREER","title":"Dashboard","subtitle":"Your market relevance","generativeSubsections":[{"id":"dashboard","templateId":"Dashboard","props":{}},{"id":"market-relevance-detail","templateId":"MarketRelevanceDetail","props":{"bubbles":[{"label":"View Market Relevance","variant":"green","showArrow":true},{"label":"Where to Invest Your Time","variant":"default"}]}}]}
```

Frontend auto-injects market relevance data from cache. Bubbles handle navigation: "View Market Relevance" → MarketRelevanceSheet (AI navigates), "Where to Invest Your Time" → widget 2 locally (no navigation).

## CareerGrowthDetail (for "Career Growth" from ProfileSheet — NOT CareerGrowthSheet)

From ProfileSheet, ALWAYS navigate to CareerGrowthDetail. NEVER navigate to CareerGrowthSheet directly — it is a child view reached via CareerGrowthDetail bubbles.

**Initial navigation payload** (must include `bubbles`):
```json
{"badge":"trAIn CAREER","title":"Dashboard","subtitle":"Your career growth","generativeSubsections":[{"id":"dashboard","templateId":"Dashboard","props":{}},{"id":"career-growth-detail","templateId":"CareerGrowthDetail","props":{"bubbles":[{"label":"View Career Growth","variant":"green","showArrow":true},{"label":"Compensation Trajectory","variant":"default"}]}}]}
```

**Widget transition payload** (for "Compensation Trajectory"):
```json
{"badge":"trAIn CAREER","title":"Dashboard","subtitle":"Your career growth","generativeSubsections":[{"id":"dashboard","templateId":"Dashboard","props":{}},{"id":"career-growth-detail","templateId":"CareerGrowthDetail","props":{"_triggerWidget":2},"_update":true}]}
```

Frontend auto-injects career growth data from cache. CareerGrowthDetail has 2 widgets with bubbles:
- Widget 1: gauge + stats + 2 bubbles ("View Career Growth", "Compensation Trajectory")
- Widget 2: compensation trajectory chart + stats + 1 bubble ("View Career Growth")

Both "View Career Growth" bubbles navigate to CareerGrowthSheet via frontend-handled navigation (same pattern as MarketRelevanceDetail and SkillsDetail).

## TargetRoleSheet (for "Target Role" from ProfileSheet)

Navigate to TargetRoleSheet when the user clicks the target role tile or says "target role", "view target role", "my target role", etc.

```json
{"badge":"trAIn CAREER","title":"Target Role","subtitle":"Your target role breakdown","generativeSubsections":[{"id":"dashboard","templateId":"Dashboard","props":{}},{"id":"target-role","templateId":"TargetRoleSheet","props":{}}]}
```

Frontend auto-injects skill and role data from cache.

## MyLearningSheet (for "My Learning" button)

Navigate to MyLearningSheet when the user clicks the learning button or says "my learning", "show my learning", etc.

```json
{"badge":"trAIn CAREER","title":"My Learning","subtitle":"Your courses and lessons","generativeSubsections":[{"id":"dashboard","templateId":"Dashboard","props":{}},{"id":"my-learning","templateId":"MyLearningSheet","props":{}}]}
```

## Template IDs (reference)

EmptyScreen, WelcomeLanding, GlassmorphicOptions, MultiSelectOptions, TextInput, RegistrationForm, LoadingGeneral, LoadingLinkedIn, CandidateSheet, CardStack, SavedJobsStack, Dashboard, ProfileSheet, SkillsDetail, SkillCoverageSheet, MarketRelevanceDetail, MarketRelevanceSheet, CareerGrowthDetail, CareerGrowthSheet, JobSearchSheet, JobDetailSheet, EligibilitySheet, CloseGapSheet, JobApplicationsSheet, PastApplicationsSheet, MyLearningSheet, TargetRoleSheet.

Deprecated: QualificationStep, JobCards.
