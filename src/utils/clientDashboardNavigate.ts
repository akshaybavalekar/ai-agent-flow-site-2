import { informTele } from "@/utils/teleUtils";

type SiteFns = { navigateToSection?: (...args: unknown[]) => unknown };

/** Canonical Dashboard + SavedJobsStack payload (trainco_dashboard_payloads / journey-dashboard). */
export const SAVED_JOBS_STACK_NAV_PAYLOAD = {
  badge: "trAIn CAREER",
  title: "Saved Jobs",
  subtitle: "Your shortlist",
  generativeSubsections: [
    { id: "dashboard", templateId: "Dashboard", props: {} },
    {
      id: "saved-jobs",
      templateId: "SavedJobsStack",
      props: {
        bubbles: [
          { label: "View full posting", variant: "default" },
          { label: "Am I eligible?", variant: "green", showArrow: true },
          { label: "Find more jobs", variant: "default" },
          { label: "View all saved jobs", variant: "default" },
        ],
      },
    },
  ],
} as const;

/** Dashboard + JobApplicationsSheet (profile Applications tile). */
export const JOB_APPLICATIONS_NAV_PAYLOAD = {
  badge: "trAIn CAREER",
  title: "Applications",
  subtitle: "Track your progress",
  generativeSubsections: [
    { id: "dashboard", templateId: "Dashboard", props: {} },
    { id: "applications", templateId: "JobApplicationsSheet", props: {} },
  ],
} as const;

/** Dashboard landing: Dashboard + ProfileSheet (dashboardAnchor). */
export const DASHBOARD_LANDING_NAV_PAYLOAD = {
  badge: "trAIn CAREER",
  title: "Dashboard",
  subtitle: "Your Profile",
  generativeSubsections: [
    { id: "dashboard", templateId: "Dashboard", props: {} },
    { id: "profile-home", templateId: "ProfileSheet", props: { dashboardAnchor: true } },
  ],
} as const;

/** Dashboard + MyLearningSheet. */
export const MY_LEARNING_NAV_PAYLOAD = {
  badge: "trAIn CAREER",
  title: "My Learning",
  subtitle: "Your courses and lessons",
  generativeSubsections: [
    { id: "dashboard", templateId: "Dashboard", props: {} },
    { id: "my-learning", templateId: "MyLearningSheet", props: {} },
  ],
} as const;

/** Dashboard + SkillsDetail. */
export const SKILLS_DETAIL_NAV_PAYLOAD = {
  badge: "trAIn CAREER",
  title: "Dashboard",
  subtitle: "Your skills overview",
  generativeSubsections: [
    { id: "dashboard", templateId: "Dashboard", props: {} },
    { id: "skills-detail", templateId: "SkillsDetail", props: {} },
  ],
} as const;

/** Dashboard + SkillCoverageSheet (deep drill-down from SkillsDetail). */
export const SKILL_COVERAGE_NAV_PAYLOAD = {
  badge: "trAIn CAREER",
  title: "Dashboard",
  subtitle: "Full skill coverage",
  generativeSubsections: [
    { id: "dashboard", templateId: "Dashboard", props: {} },
    { id: "skill-coverage-sheet", templateId: "SkillCoverageSheet", props: {} },
  ],
} as const;

/** Dashboard + SkillTestFlow (Kubernetes learning path from SkillsDetail). */
export const SKILL_TEST_FLOW_NAV_PAYLOAD = {
  badge: "trAIn CAREER",
  title: "Dashboard",
  subtitle: "Kubernetes learning",
  generativeSubsections: [
    { id: "dashboard", templateId: "Dashboard", props: {} },
    { id: "skill-test-flow", templateId: "SkillTestFlow", props: {} },
  ],
} as const;

/** Dashboard + TargetRoleSheet. */
export const TARGET_ROLE_NAV_PAYLOAD = {
  badge: "trAIn CAREER",
  title: "Target Role",
  subtitle: "Your target role breakdown",
  generativeSubsections: [
    { id: "dashboard", templateId: "Dashboard", props: {} },
    { id: "target-role", templateId: "TargetRoleSheet", props: {} },
  ],
} as const;

/** Canonical Dashboard + JobSearchSheet payload. */
export const JOB_SEARCH_NAV_PAYLOAD = {
  badge: "trAIn CAREER",
  title: "Job Center",
  subtitle: "Find your next job here",
  generativeSubsections: [
    { id: "dashboard", templateId: "Dashboard", props: {} },
    { id: "job-search", templateId: "JobSearchSheet", props: {} },
  ],
} as const;

// ── Browse screen history tracker ───────────────────────────────────────────
// Tracks which screen is active and where JobSearchSheet was opened from,
// so close/back buttons always return to the correct previous screen.

type BrowseScreen = "saved-jobs" | "job-search";
let _lastBrowseScreen: BrowseScreen | null = null;
/** Recorded just before navigating to JobSearchSheet — tells close where to return. */
let _jobSearchOpenedFrom: BrowseScreen | null = null;

/** Called by SavedJobsStack and JobSearchSheet on mount. */
export function setLastBrowseScreen(screen: BrowseScreen): void {
  _lastBrowseScreen = screen;
}

/**
 * Navigate back to whichever browse screen was last active (called by JobDetailSheet / EligibilitySheet).
 * Falls back to popJobBrowseScreen (event-based) if the host navigator is unavailable.
 */
export function navigateBackToBrowseScreen(fallback: () => void): void {
  if (_lastBrowseScreen === "saved-jobs") {
    if (navigateClientToSavedJobsStack()) return;
  }
  if (_lastBrowseScreen === "job-search") {
    if (navigateClientToJobSearchSheet()) return;
  }
  fallback();
}

/**
 * Navigate back from JobSearchSheet to wherever it was opened from.
 * If opened from SavedJobsStack → returns there; otherwise → dashboard.
 */
export function navigateBackFromJobSearch(fallback: () => void): void {
  if (_jobSearchOpenedFrom === "saved-jobs") {
    _jobSearchOpenedFrom = null;
    if (navigateClientToSavedJobsStack()) return;
  }
  _jobSearchOpenedFrom = null;
  fallback();
}

function getNavigateToSection(): ((...args: unknown[]) => unknown) | undefined {
  const siteFns = (window as unknown as { UIFrameworkSiteFunctions?: SiteFns }).UIFrameworkSiteFunctions;
  const nav = siteFns?.navigateToSection;
  return typeof nav === "function" ? nav : undefined;
}

/**
 * Navigates immediately to Saved Jobs (card stack + bubbles) via the same hook the Runtime uses.
 * Call this from ProfileSheet so the UI does not depend on the model choosing SavedJobsStack vs JobApplicationsSheet.
 */
export function navigateClientToSavedJobsStack(): boolean {
  const nav = getNavigateToSection();
  if (!nav) return false;
  try {
    const out = nav(SAVED_JOBS_STACK_NAV_PAYLOAD);
    if (out === false) return false;
    informTele(
      "[SYSTEM] Client navigated to SavedJobsStack from profile. " +
        "Do NOT call navigateToSection to JobApplicationsSheet or replace this view.",
    );
    return true;
  } catch {
    return false;
  }
}

/** Navigates to Job Center (JobSearchSheet), optionally with saved-only filter pre-set. */
export function navigateClientToJobSearchSheet(showSavedOnly = false): boolean {
  const nav = getNavigateToSection();
  if (!nav) return false;
  // Capture origin before _lastBrowseScreen is overwritten by JobSearchSheet mounting.
  _jobSearchOpenedFrom = _lastBrowseScreen;
  try {
    const payload = showSavedOnly
      ? {
          ...JOB_SEARCH_NAV_PAYLOAD,
          generativeSubsections: [
            { id: "dashboard", templateId: "Dashboard", props: {} },
            { id: "job-search", templateId: "JobSearchSheet", props: { showSavedOnly: true } },
          ],
        }
      : JOB_SEARCH_NAV_PAYLOAD;
    const out = nav(payload);
    if (out === false) return false;
    informTele(
      showSavedOnly
        ? "[SYSTEM] Client navigated to JobSearchSheet with saved-only filter active. Do NOT call navigateToSection."
        : "[SYSTEM] Client navigated to JobSearchSheet (browse all). Do NOT call navigateToSection.",
    );
    return true;
  } catch {
    return false;
  }
}

/** Same pattern as Saved Jobs — opens Job Applications tracking. */
export function navigateClientToJobApplications(): boolean {
  const nav = getNavigateToSection();
  if (!nav) return false;
  try {
    const out = nav(JOB_APPLICATIONS_NAV_PAYLOAD);
    if (out === false) return false;
    informTele(
      "[SYSTEM] Client navigated to JobApplicationsSheet from profile. " +
        "Do NOT call navigateToSection to SavedJobsStack for this turn.",
    );
    return true;
  } catch {
    return false;
  }
}

/** Navigates to Dashboard landing (Dashboard + ProfileSheet with dashboardAnchor). */
export function navigateClientToDashboardLanding(fromLearning = false): boolean {
  const nav = getNavigateToSection();
  if (!nav) return false;
  try {
    const out = nav(DASHBOARD_LANDING_NAV_PAYLOAD);
    if (out === false) return false;
    const message = fromLearning
      ? "[SYSTEM] Client navigated to dashboard landing after completing Kubernetes learning. " +
        "The candidate now has Kubernetes at Beginner level in their profile. " +
        "Call get_jobs_by_skills with candidate_id and limit 6 to refresh job scores with the updated skills. " +
        "Then say: \"Your profile has been updated. Your new Kubernetes skill has improved your job matches.\" " +
        "Do NOT call navigateToSection."
      : "[SYSTEM] Client navigated to dashboard landing. UI restored Dashboard + ProfileSheet. " +
        "Do NOT call navigateToSection. Acknowledge briefly if needed.";
    informTele(message);
    return true;
  } catch {
    return false;
  }
}

/** Navigates to MyLearningSheet (Dashboard + MyLearningSheet). */
export function navigateClientToMyLearning(): boolean {
  const nav = getNavigateToSection();
  if (!nav) return false;
  try {
    const out = nav(MY_LEARNING_NAV_PAYLOAD);
    if (out === false) return false;
    informTele(
      "[SYSTEM] Client navigated to MyLearningSheet. UI is showing the learning dashboard. " +
        "Do NOT call navigateToSection. Say: \"Here's your learning dashboard.\"",
    );
    return true;
  } catch {
    return false;
  }
}

/** Navigates to SkillsDetail (Dashboard + SkillsDetail). */
export function navigateClientToSkillsDetail(): boolean {
  const nav = getNavigateToSection();
  if (!nav) return false;
  try {
    const out = nav(SKILLS_DETAIL_NAV_PAYLOAD);
    if (out === false) return false;
    informTele(
      "[SYSTEM] Client navigated to SkillsDetail. UI is showing the skills overview. " +
        "Do NOT call navigateToSection.",
    );
    return true;
  } catch {
    return false;
  }
}

/** Navigates to SkillCoverageSheet (Dashboard + SkillCoverageSheet). */
export function navigateClientToSkillCoverage(): boolean {
  const nav = getNavigateToSection();
  if (!nav) return false;
  try {
    const out = nav(SKILL_COVERAGE_NAV_PAYLOAD);
    if (out === false) return false;
    informTele(
      "[SYSTEM] Client navigated to SkillCoverageSheet. UI is showing the full skill coverage. " +
        "Do NOT call navigateToSection.",
    );
    return true;
  } catch {
    return false;
  }
}

/** Navigates to SkillTestFlow (Dashboard + SkillTestFlow). */
export function navigateClientToSkillTestFlow(): boolean {
  const nav = getNavigateToSection();
  if (!nav) return false;
  try {
    const out = nav(SKILL_TEST_FLOW_NAV_PAYLOAD);
    if (out === false) return false;
    informTele(
      "[SYSTEM] Client navigated to SkillTestFlow. User started Kubernetes learning path. " +
        "This is NOT skill coverage. You are now in journey-learning context. " +
        "Do NOT call navigateToSection. Say: \"Let's upgrade your Kubernetes Skill. " +
        "We can create a learning plan or take a practical test to validate your knowledge.\"",
    );
    return true;
  } catch {
    return false;
  }
}

/** Dashboard + MarketRelevanceSheet (full breakdown from MarketRelevanceDetail). */
export const MARKET_RELEVANCE_SHEET_NAV_PAYLOAD = {
  badge: "trAIn CAREER",
  title: "Dashboard",
  subtitle: "Full market relevance",
  generativeSubsections: [
    { id: "dashboard", templateId: "Dashboard", props: {} },
    { id: "market-relevance-sheet", templateId: "MarketRelevanceSheet", props: {} },
  ],
} as const;

/** Navigates to MarketRelevanceSheet (Dashboard + MarketRelevanceSheet). */
export function navigateClientToMarketRelevanceSheet(): boolean {
  const nav = getNavigateToSection();
  if (!nav) return false;
  try {
    const out = nav(MARKET_RELEVANCE_SHEET_NAV_PAYLOAD);
    if (out === false) return false;
    informTele(
      "[SYSTEM] Client navigated to MarketRelevanceSheet. UI is showing the full market relevance breakdown. " +
        "Do NOT call navigateToSection.",
    );
    return true;
  } catch {
    return false;
  }
}

/** Dashboard + CareerGrowthSheet (full breakdown from CareerGrowthDetail). */
export const CAREER_GROWTH_SHEET_NAV_PAYLOAD = {
  badge: "trAIn CAREER",
  title: "Dashboard",
  subtitle: "Full career growth",
  generativeSubsections: [
    { id: "dashboard", templateId: "Dashboard", props: {} },
    { id: "career-growth-sheet", templateId: "CareerGrowthSheet", props: {} },
  ],
} as const;

/** Navigates to CareerGrowthSheet (Dashboard + CareerGrowthSheet). */
export function navigateClientToCareerGrowthSheet(): boolean {
  const nav = getNavigateToSection();
  if (!nav) return false;
  try {
    const out = nav(CAREER_GROWTH_SHEET_NAV_PAYLOAD);
    if (out === false) return false;
    informTele(
      "[SYSTEM] Client navigated to CareerGrowthSheet. UI is showing the full career growth breakdown. " +
        "Do NOT call navigateToSection.",
    );
    return true;
  } catch {
    return false;
  }
}

/** Navigates to TargetRoleSheet (Dashboard + TargetRoleSheet). */
export function navigateClientToTargetRole(): boolean {
  const nav = getNavigateToSection();
  if (!nav) return false;
  try {
    const out = nav(TARGET_ROLE_NAV_PAYLOAD);
    if (out === false) return false;
    informTele(
      "[SYSTEM] Client navigated to TargetRoleSheet. UI is showing the target role breakdown. " +
        "Do NOT call navigateToSection. Say: \"Here's your target role breakdown.\"",
    );
    return true;
  } catch {
    return false;
  }
}
