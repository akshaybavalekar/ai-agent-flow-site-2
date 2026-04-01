const STORAGE_KEY = "trainco_visitor_session";

/**
 * Captured at module load time. True only if a session existed when the app started
 * (returning visitor). False for first-time users who complete onboarding mid-session.
 */
export const HAD_SESSION_AT_APP_START = (() => {
  try {
    return !!localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
})();

export interface VisitorSession {
  candidateId: string;
  /** Set by saveLearningCompleted() when user completes learning. Resets on new login. */
  learningCompleted?: boolean;
}

export function saveVisitorSession(candidateId: string): void {
  try {
    const session: VisitorSession = { candidateId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    window.dispatchEvent(new CustomEvent("visitor-session-changed"));
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded)
  }
}

/**
 * Marks the current candidate's learning path as completed in localStorage.
 */
export function saveLearningCompleted(): void {
  try {
    const existing = getVisitorSession();
    if (!existing?.candidateId) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, learningCompleted: true }));
  } catch {
    // localStorage may be unavailable
  }
}

/**
 * Clears the learning completed flag for the current candidate.
 */
export function clearLearningCompleted(): void {
  try {
    const existing = getVisitorSession();
    if (!existing?.candidateId) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { learningCompleted: _, ...rest } = existing;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  } catch {
    // localStorage may be unavailable
  }
}

export function getVisitorSession(): VisitorSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<VisitorSession>;
    if (!data.candidateId) return null;
    return { candidateId: data.candidateId, learningCompleted: data.learningCompleted };
  } catch {
    return null;
  }
}

export function clearVisitorSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).resetLearningState = () => {
    clearLearningCompleted();
    console.log("Learning state reset. Reload the page to see 'before learning' data.");
  };
}
