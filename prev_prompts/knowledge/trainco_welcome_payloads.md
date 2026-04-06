# trAIn — Welcome & qualification payloads

Exact navigateToSection payloads for journey-welcome Steps 1–5. Use verbatim; fill only dynamic fields (e.g. role labels from qualification options).

## Step 1 — Greeting (start)

```json
{"badge":"MOBEUS CAREER","title":"Welcome","subtitle":"Getting started","generativeSubsections":[{"id":"start","templateId":"GlassmorphicOptions","props":{"bubbles":[{"label":"Yes, I'm ready"},{"label":"Not just yet"},{"label":"Tell me more"}]}}]}
```

## Step 1 — Tell me more

```json
{"badge":"MOBEUS CAREER","title":"Welcome","subtitle":"About TrAIn","generativeSubsections":[{"id":"tell-me-more","templateId":"GlassmorphicOptions","props":{"bubbles":[{"label":"How does TrAIn work?"},{"label":"How is TrAIn different?"},{"label":"Can I build skills on TrAIn?"},{"label":"Which jobs can I find on TrAIn?"},{"label":"How does TrAIn use my data?"},{"label":"Something else"}]}}]}
```

## Step 2 — Industry

```json
{"badge":"MOBEUS CAREER","title":"Qualification","subtitle":"Step 1 of 3","generativeSubsections":[{"id":"industry","templateId":"MultiSelectOptions","props":{"bubbles":[{"label":"Technology"},{"label":"Finance"},{"label":"Healthcare"},{"label":"Construction"},{"label":"Something else"},{"label":"I'm not sure"}],"showProgress":true,"progressStep":0,"progressTotal":3}}]}
```

## Step 2 — Industry TextInput (Something else branch)

```json
{"badge":"MOBEUS CAREER","title":"Qualification","subtitle":"Step 1 of 3","generativeSubsections":[{"id":"industry-text","templateId":"TextInput","props":{"placeholder":"Type industry"}}]}
```

## Step 2 — Exploration (I'm not sure branch)

```json
{"badge":"MOBEUS CAREER","title":"Exploration","subtitle":"Tell us what you enjoy","generativeSubsections":[{"id":"exploration","templateId":"MultiSelectOptions","props":{"bubbles":[{"label":"Solving a puzzle or problem"},{"label":"Creating something from scratch"},{"label":"Helping someone through a tough moment"},{"label":"Organising chaos into order"},{"label":"Learning something completely new"},{"label":"Leading a group"}]}}]}
```

## Step 3 — Role

Use role labels from qualification options (search "role options [industry]"). Append Something else · I'm not sure. id: "role", progressStep: 1, progressTotal: 3.

## Step 3 — Role TextInput (Something else branch)

```json
{"badge":"MOBEUS CAREER","title":"Qualification","subtitle":"Step 2 of 3","generativeSubsections":[{"id":"role-custom","templateId":"TextInput","props":{"placeholder":"Type role"}}]}
```

## Step 3 — Role exploration (I'm not sure at Role)

Use interest labels from qualification options (search "interest options [industry]"). id: "role-exploration".

## Step 4 — Priority

```json
{"badge":"MOBEUS CAREER","title":"Priorities","subtitle":"Step 3 of 3","generativeSubsections":[{"id":"priority","templateId":"MultiSelectOptions","props":{"bubbles":[{"label":"Searching and browsing listings"},{"label":"Experience and personality fit"},{"label":"Location"},{"label":"Know which skills are required"},{"label":"Take courses and earn certifications"},{"label":"Something else"}],"showProgress":true,"progressStep":2,"progressTotal":3}}]}
```

## Step 4 — Priority TextInput (Something else branch)

```json
{"badge":"MOBEUS CAREER","title":"Priorities","subtitle":"Step 3 of 3","generativeSubsections":[{"id":"priority-text","templateId":"TextInput","props":{"placeholder":"Type what matters most"}}]}
```

## Step 5 — Registration

```json
{"badge":"MOBEUS CAREER","title":"Registration","subtitle":"Create your account","generativeSubsections":[{"id":"registration","templateId":"RegistrationForm","props":{}}]}
```
