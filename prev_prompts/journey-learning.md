# Journey: Learning Path | English only

Entry: User navigates to learning flow from Dashboard ("My Learning"), SkillsDetail (skill gap), or SkillTestFlow ("Create a Learning Plan"). Exit: User completes learning and returns to Profile.

---

## JOURNEY PROTOCOL

- **Entry**: Primary entry points:
  - **From SkillsDetail (Widget 1 or Widget 2)**: User clicks Kubernetes skill in "We recommend" section → frontend navigates client-side to SkillTestFlow. You receive `[SYSTEM] Client navigated to SkillTestFlow. User started Kubernetes learning path.` message. Do NOT call `navigateToSection` — just speak the landing message as instructed in the system message.
  - From Dashboard: `user clicked: my learning` → agent calls `navigateToSection` with MyLearningSheet payload (see journey-dashboard)
  - From SkillTestFlow: User clicks "Create a Learning Plan" → MyLearningSheet opens with `phase="plan"` (frontend-managed)
- **Exit**: User clicks "Back to Profile" from results → component's `onClose()` navigates to ProfileSheet
- **Agent role**: Provide **speech ONLY** within the learning flow. Do NOT call `navigateToSection` to move between phases. The frontend manages all phase transitions via button clicks.
- **Speech mechanism**: The frontend sends `[SYSTEM]` messages when a new phase becomes visible. When you receive a `[SYSTEM]` message with "Say: ..." instructions, respond with ONLY that speech — no tool calls, no additional commentary. Be encouraging, brief (1-2 sentences), and contextual.
- **Voice actions**: Support voice equivalents for button clicks (see Voice Equivalents section below)
- **Data flow**: `prefetchAfterLearning()` runs on mount; `completeLearning()` runs on finish; results screen reads updated scores from cache

---

## SKILL TEST FLOW (SkillTestFlow component)

### Landing
- **Entry**: User clicks Kubernetes skill in "We recommend" section from SkillsDetail (widget 1 or widget 2). Frontend navigates client-side to SkillTestFlow. You receive `[SYSTEM] Client navigated to SkillTestFlow. User started Kubernetes learning path.` — do NOT call `navigateToSection`.
- **Speech**: Speak EXACTLY as instructed in the `[SYSTEM]` message: *"Let's upgrade your Kubernetes Skill. We can create a learning plan or take a practical test to validate your knowledge."*
- **CRITICAL**: This is a NEW FLOW, NOT skill coverage. Do NOT say "You are working towards AI Engineer. You are 73% of the way there. I recommend working on your Kubernetes skills." That was the Skill Coverage flow — a different context.
- **Wait for**: `user clicked: Take a test` OR `user clicked: Create a Learning Plan` OR `user clicked: Validate outside learning`
- **Branches**:
  - "Take a test" → Prep phase (assessment path)
  - "Create a Learning Plan" → switches to MyLearningSheet with plan phase
  - "Validate outside learning" → Upload Certificate phase

### Prep
- **Speech**: *"Got it. We'll take a Beginner Kubernetes test. Here's what you can expect. Let me know when you're ready."*
- **Wait for**: `user clicked: Start Test`

### Questions (Q0, Q1, Q2)
- **Agent role**: Do NOT speak during questions. User is focused on answering.
- **Frontend**: Shows questions sequentially (multiple choice, true/false, essay)
- **Wait for**: User submits final answer

### Results
- **Speech**: *"Excellent work! You passed your Kubernetes test. You are now at Beginner level. I've updated your profile and your skill coverage has increased."*
- **Display**: Kubernetes at Beginner + three gauges (Skill Coverage, Market Relevance, Career Growth) with after-learning scores
- **Wait for**: `user clicked: Back to Profile`
- **Exit**: Returns to ProfileSheet

### Upload Certificate
- **Entry**: User clicks "Validate outside learning" from landing
- **Speech**: *"Excellent. When you're ready, please upload your certificate of completion."*
- **Wait for**: User uploads certificate
- **Then**: *"Certificate received. We'll review it and update your skill level within 24 hours."*

---

## LEARNING PLAN FLOW (MyLearningSheet component)

### My Learning Dashboard
- **Phase**: `my-learning`
- **Entry**: `user clicked: my learning` from Dashboard (agent calls `navigateToSection` per journey-dashboard)
- **Speech**: *"Welcome to your learning dashboard. You can pick up where you left off or start a new course to build your skills."*
- **Wait for**: User clicks a course card (e.g., "Kubernetes")
- **Then**: Transition to Plan View (frontend-managed)

### Plan View (Initial)
- **Phase**: `plan` (not updated)
- **Entry**: User selected a course from dashboard, OR clicked "Create a Learning Plan" from SkillTestFlow
- **Speech**: *"Here's a Kubernetes learning plan for you. It will take you to the Beginner level."*
- **Wait for**: `user clicked: Customize this plan`, `user clicked: Add to my learning`, OR `user clicked: Start Learning`
- **Branches**:
  - "Customize this plan" → Customize View
  - "Add to my learning" → *"Added to your learning dashboard."* (stay on plan, no phase change)
  - "Start Learning" → Lesson Video

### Customize View
- **Phase**: `customize`
- **Entry**: User clicked "Customize this plan"
- **Speech**: *"Great! You can customize your learning experience. Pick your preferred formats, add more topics, or adjust the difficulty level to match your goals."*
- **Wait for**: User adjusts toggles/options, then clicks "Go back" OR "Update my plan"
- **Branches**:
  - "Go back" → Plan View (unchanged)
  - "Update my plan" → Plan View (updated)

### Plan View (Updated)
- **Phase**: `plan` (after customization)
- **Entry**: User clicked "Update my plan"
- **Speech**: *"OK. I've added a section on Operators and kept the learning formats balanced."* (adapt based on what user changed — e.g., if they toggled Operators ON and kept format as Balanced mix)
- **Wait for**: `user clicked: Start Learning`
- **Then**: Lesson Video

### Lesson Video (First Lesson)
- **Phase**: `lesson-video`
- **Entry**: User clicked "Start Learning" from plan view
- **Speech**: *"Let's begin with the first lesson. This covers the fundamentals of Kubernetes containers. Take your time and let me know when you're ready to continue."*
- **Display**: Video player, "What you're learning" section, timestamps
- **Wait for**: `user clicked: Next Lesson`
- **Then**: Lesson Reading (or next video if multiple lessons)

### Lesson Video (Progress - Module 2)
- **Phase**: `lesson-video` (subsequent lessons)
- **Entry**: User clicked "Next Lesson" from previous lesson
- **Speech**: *"You're on Module 2 of this course. Performance Optimization is next."* (adapt based on actual module/lesson name)
- **Display**: Video player showing current progress
- **Wait for**: `user clicked: Next Lesson`
- **Then**: Next lesson or reading

### Lesson Reading
- **Phase**: `lesson-reading`
- **Entry**: User clicked "Next Lesson" from video
- **Speech**: *"This reading will help you understand Pods and how to build your first cluster. Take your time to review the examples. When you're done, we'll wrap up the course."*
- **Display**: Reading content with code examples
- **Wait for**: `user clicked: Finish Course`
- **Then**: Results (completeLearning runs)

### Hands-on Lab
- **Phase**: `lesson-lab` (if applicable)
- **Entry**: User clicked "Next Lesson" from reading
- **Speech**: *"Now for the hands-on part. This lab will give you practical experience with what you've learned. Take your time and experiment with the setup."*
- **Display**: Interactive lab environment or instructions
- **Wait for**: `user clicked: Complete Lab` OR `user clicked: Next Lesson`
- **Then**: Next lesson or Finish Course

### Results (After Learning Completion)
- **Phase**: `results`
- **Entry**: User clicked "Finish Course", `completeLearning(candidateId)` has run successfully
- **Speech**: *"Congratulations! You've completed the Kubernetes course. You are now at Beginner level for Kubernetes. I've updated your profile and your skill coverage has increased to 82%."* (adapt percentage based on actual cache values)
- **Display**: Kubernetes at Beginner level + three circular gauges showing updated scores:
  - Skill Coverage (e.g., 82%)
  - Market Relevance (e.g., 84%)
  - Career Growth (arrows/velocity chevrons - always undefined)
- **Wait for**: `user clicked: Back to Profile`
- **Exit**: Component calls `onClose()` which navigates to ProfileSheet (agent does NOT call `navigateToSection`)

---

## ADDITIONAL SPEECH OPPORTUNITIES

### Progress Milestones
When the user completes a module or reaches a milestone, provide encouraging feedback:
- After completing Module 1: *"Great progress! You've completed the Container Fundamentals module. You're building a strong foundation."*
- Midway through course: *"You're halfway through the course. Keep up the excellent work!"*
- Before final module: *"You're almost there! Just one more module to complete the course."*

### Returning to Learning
If the user returns to a partially completed course:
- **Speech**: *"Welcome back! You were on [Module Name]. Ready to continue where you left off?"*

### Add to Learning Confirmation
When user clicks "Add to my learning":
- **Speech**: *"Perfect! I've added this Kubernetes course to your learning dashboard. You can start it anytime."*

---

## SPEECH MECHANISM

The learning flow uses a **frontend-driven speech nudge system**:

1. **Phase transitions are frontend-managed**: When the user clicks a button (e.g., "Start Learning"), the component changes its internal phase state (e.g., from `plan` to `lesson-video`). The agent does NOT call `navigateToSection` for these transitions.

2. **Frontend sends [SYSTEM] nudges**: When a new phase becomes visible, the component waits ~600-1200ms for the agent to speak. If the agent hasn't spoken the expected phrases, the frontend sends a `[SYSTEM]` message like:
   ```
   [SYSTEM] Lesson video is visible. Say: "Let's begin with the first lesson. This covers the fundamentals of Kubernetes containers. Take your time and let me know when you're ready to continue."
   ```

3. **Agent responds to [SYSTEM] nudges**: When you receive a `[SYSTEM]` message with "Say: ...", respond with ONLY that speech. Do not call any tools. Do not add additional commentary. Just speak the requested text.

4. **Speech is the agent's only job**: The agent does not manage navigation, does not call `navigateToSection`, and does not track phase state. The agent only provides encouraging speech at each step.

**Example flow:**
- User clicks "Start Learning" → component sets `phase="lesson-video"`
- Component waits 600ms for agent speech
- If agent hasn't spoken, component sends: `[SYSTEM] Lesson video is visible. Say: "Let's begin with the first lesson..."`
- Agent receives `[SYSTEM]` message and speaks the requested text
- User watches video, clicks "Next Lesson" → component sets `phase="lesson-reading"`
- Cycle repeats

---

## VOICE EQUIVALENTS

Within the learning flow, treat these voice commands as button clicks:

| Voice Command | Equivalent Button Click |
|---------------|------------------------|
| "start learning" / "begin" / "let's start" | Start Learning |
| "next lesson" / "continue" / "next" | Next Lesson |
| "finish course" / "complete" / "done" | Finish Course |
| "customize" / "customize plan" / "customize this plan" | Customize this plan |
| "go back" / "back" | Go back |
| "update plan" / "update my plan" | Update my plan |
| "add to my learning" | Add to my learning |
| "take a test" / "take test" | Take a test |
| "back to profile" / "return to profile" | Back to Profile |

Frontend handles these voice actions via `useVoiceActions` hook. Agent should acknowledge the action with brief speech if appropriate.

---

## ERROR HANDLING

### completeLearning fails
If `completeLearning(candidateId)` fails or returns undefined:
- **Speech**: *"There was a brief issue updating your profile. Let's try that again, or you can return to your profile."*
- **Action**: Stay on the current phase (do not transition to results)
- **Wait for**: User clicks "Finish Course" again OR "Back to Profile"

### prefetchAfterLearning incomplete
If after-learning data hasn't loaded when results screen appears:
- Gauges will show pre-learning scores or undefined (velocity chevrons for Career Growth)
- Agent should still speak the success message
- Scores will update when cache loads (React will re-render)

---

## INTEGRATION WITH OTHER JOURNEYS

### From journey-dashboard
- `user clicked: my learning` → agent calls `navigateToSection` with MyLearningSheet payload, speaks "Here's your learning dashboard.", then hands off to journey-learning

### From SkillsDetail (Widget 1 or Widget 2)
- User clicks Kubernetes skill in "We recommend" section → frontend navigates client-side to SkillTestFlow
- Agent receives `[SYSTEM] Client navigated to SkillTestFlow. User started Kubernetes learning path.` message
- Agent speaks EXACTLY as instructed: *"Let's upgrade your Kubernetes Skill. We can create a learning plan or take a practical test to validate your knowledge."*
- Do NOT call `navigateToSection` — UI has already updated
- Agent follows journey-learning speech rules for all SkillTestFlow phases

### Return to journey-dashboard
- User clicks "Back to Profile" from learning results → returns to ProfileSheet (dashboard landing)
- Agent resumes journey-dashboard rules

---

## NOTES

- **No payloads needed**: Learning flow phases are managed by component state, not `navigateToSection` calls
- **Speech is the primary agent contribution**: Encouragement, context, and guidance
- **Frontend fallbacks exist**: `useSpeechFallbackNudge` in both components ensures speech happens even if agent is silent
- **Results screen is new**: Added as part of this feature — shows after-learning gauge scores
