import { saveVisitorSession, getVisitorSession, saveLearningCompleted, clearLearningCompleted } from "@/utils/visitorMemory";
import { loadIntoCache, readCache, type McpCache } from "@/platform/mcpCacheBridge";

const inFlight = new Set<string>();

/** Hosted/static deploys (e.g. Mobeus) often omit POST /api/invoke/* — stop retrying after 405/404. */
const skippedInvokeTools = new Set<string>();

async function invokeBridge(
  toolName: string,
  cacheKey: keyof McpCache,
  args: Record<string, unknown>,
): Promise<true | undefined> {
  if (skippedInvokeTools.has(toolName)) {
    return undefined;
  }
  try {
    const res = await fetch(`/api/invoke/${toolName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
    if (!res.ok) {
      if (res.status === 405 || res.status === 404) {
        skippedInvokeTools.add(toolName);
        console.warn(
          `[mcpBridge] ${toolName} returned ${res.status} — invoke route not available on this host; will not retry.`,
        );
        return undefined;
      }
      console.error(`[mcpBridge] ${toolName} failed:`, res.status);
      return undefined;
    }
    const data = await res.json();
    loadIntoCache(cacheKey, data);
    return true;
  } catch (err) {
    console.error(`[mcpBridge] ${toolName} error:`, err);
    return undefined;
  }
}

/**
 * Unwraps the cached / API jobs value into a flat array of job records.
 */
export function resolveJobsArray(cache: unknown): unknown[] {
  if (Array.isArray(cache)) return cache;
  if (cache && typeof cache === "object") {
    const obj = cache as Record<string, unknown>;
    if (Array.isArray(obj.jobs)) return obj.jobs;
    const data = obj.data;
    if (data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      if (Array.isArray(d.jobs)) return d.jobs;
    }
    if (Array.isArray(obj.results)) return obj.results;
    if (Array.isArray(obj.data)) return obj.data;
  }
  return [];
}

export async function fetchJobs(candidateId: string): Promise<true | undefined> {
  if (!candidateId?.trim()) return undefined;
  if (inFlight.has("jobs")) return undefined;
  inFlight.add("jobs");
  try {
    const sess = getVisitorSession();
    if (sess?.learningCompleted) {
      void fetch(`/api/learning/${candidateId.trim()}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).catch(() => {});
      const res = await fetch(`/api/learning/${candidateId.trim()}/jobs/after?limit=6`);
      if (res.ok) {
        loadIntoCache("jobs", await res.json() as unknown);
        return true;
      }
    }
    return await invokeBridge("get_jobs_by_skills", "jobs", { candidate_id: candidateId.trim(), limit: 6 });
  } finally {
    inFlight.delete("jobs");
  }
}

export async function fetchSkills(roleId: string): Promise<true | undefined> {
  if (!roleId?.trim()) return undefined;
  if (inFlight.has("skills")) return undefined;
  inFlight.add("skills");
  try {
    const sess = getVisitorSession();
    if (sess?.candidateId) {
      const phase = sess.learningCompleted ? "after" : "before";
      const endpoint = `/api/learning/${sess.candidateId}/skills/${roleId.trim()}?phase=${phase}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json() as unknown;
        loadIntoCache("skills", data);
        return true;
      }
    }
    return await invokeBridge("get_skill_progression", "skills", { role_id: roleId.trim() });
  } finally {
    inFlight.delete("skills");
  }
}

function unwrapCandidateResponse(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") return {};
  const obj = payload as Record<string, unknown>;
  for (const key of ["data", "result"] as const) {
    const inner = obj[key];
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      return inner as Record<string, unknown>;
    }
  }
  return obj;
}

export async function fetchCandidate(candidateId: string): Promise<true | undefined> {
  if (!candidateId?.trim()) return undefined;
  const cid = candidateId.trim();
  if (inFlight.has("candidate")) return undefined;
  inFlight.add("candidate");
  try {
    const res = await fetch("/api/invoke/get_candidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidate_id: cid }),
    });
    if (!res.ok) return undefined;
    const raw = await res.json();
    const candidate = unwrapCandidateResponse(raw);
    loadIntoCache("candidate", candidate);
    saveVisitorSession(cid);
    return true;
  } catch (err) {
    console.error("[mcpBridge] fetchCandidate error:", err);
    return undefined;
  } finally {
    inFlight.delete("candidate");
  }
}

export async function fetchCareerGrowth(candidateId: string): Promise<true | undefined> {
  if (!candidateId?.trim()) return undefined;
  if (inFlight.has("careerGrowth")) return undefined;
  inFlight.add("careerGrowth");
  try {
    const sess = getVisitorSession();
    if (sess?.candidateId) {
      const phase = sess.learningCompleted ? "after" : "before";
      const endpoint = `/api/learning/${sess.candidateId}/career-growth?phase=${phase}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        loadIntoCache("careerGrowth", await res.json() as unknown);
        return true;
      }
    }
    return await invokeBridge("get_career_growth", "careerGrowth", { candidate_id: candidateId.trim() });
  } finally {
    inFlight.delete("careerGrowth");
  }
}

export async function fetchMarketRelevance(candidateId: string): Promise<true | undefined> {
  if (!candidateId?.trim()) return undefined;
  if (inFlight.has("marketRelevance")) return undefined;
  inFlight.add("marketRelevance");
  try {
    const sess = getVisitorSession();
    if (sess?.candidateId) {
      const phase = sess.learningCompleted ? "after" : "before";
      const endpoint = `/api/learning/${sess.candidateId}/market-relevance?phase=${phase}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        loadIntoCache("marketRelevance", await res.json() as unknown);
        return true;
      }
    }
    return await invokeBridge("get_market_relevance", "marketRelevance", { candidate_id: candidateId.trim() });
  } finally {
    inFlight.delete("marketRelevance");
  }
}

async function fetchJsonSafe(url: string): Promise<unknown> {
  try {
    const res = await fetch(url);
    return res.ok ? (await res.json() as unknown) : null;
  } catch {
    return null;
  }
}

async function swapOrFetch(
  cached: unknown,
  url: string,
  activeKey: keyof McpCache,
  afterKey: keyof McpCache,
): Promise<void> {
  const data = cached ?? await fetchJsonSafe(url);
  if (data) {
    loadIntoCache(activeKey, data);
    loadIntoCache(afterKey, data);
  }
}

export async function syncLearningState(candidateId: string): Promise<boolean> {
  if (!candidateId?.trim()) return false;

  try {
    const sess = getVisitorSession();
    if (!sess?.learningCompleted) {
      return false;
    }

    const res = await fetch(`/api/learning/${candidateId.trim()}/status`);
    if (!res.ok) {
      return false;
    }

    const data = await res.json() as { completed: boolean };
    
    if (!data.completed && sess.learningCompleted) {
      console.log("[mcpBridge] Backend state reset detected. Clearing localStorage learning flag.");
      clearLearningCompleted();
      // Do not refetch via client /api/invoke — agent repopulates cache via navigateToSection / tools.
      return true;
    }
    
    return false;
  } catch (err) {
    console.warn("[mcpBridge] syncLearningState failed:", err);
    return false;
  }
}

export async function prefetchAfterLearning(
  candidateId: string,
  roleId = "ai-engineer",
): Promise<void> {
  const cid = candidateId.trim();
  if (!cid) return;
  if (inFlight.has("prefetchAfter")) return;
  if (readCache().skillsAfter) return;
  inFlight.add("prefetchAfter");
  try {
    await Promise.allSettled([
      (async () => {
        const d = await fetchJsonSafe(`/api/learning/${cid}/skills/${roleId}/after`);
        if (d) loadIntoCache("skillsAfter", d);
      })(),
      (async () => {
        const d = await fetchJsonSafe(`/api/learning/${cid}/market-relevance/after`);
        if (d) loadIntoCache("marketRelevanceAfter", d);
      })(),
      (async () => {
        const d = await fetchJsonSafe(`/api/learning/${cid}/career-growth/after`);
        if (d) loadIntoCache("careerGrowthAfter", d);
      })(),
      (async () => {
        const d = await fetchJsonSafe(`/api/learning/${cid}/jobs/after?limit=6`);
        if (d) loadIntoCache("jobsAfter", d);
      })(),
    ]);
  } finally {
    inFlight.delete("prefetchAfter");
  }
}

export async function completeLearning(candidateId: string): Promise<true | undefined> {
  if (!candidateId?.trim()) return undefined;
  const cid = candidateId.trim();

  try {
    const flagRes = await fetch(`/api/learning/${cid}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!flagRes.ok) {
      console.error("[mcpBridge] completeLearning flag failed:", flagRes.status);
      return undefined;
    }

    const snapshot = readCache();
    await Promise.allSettled([
      swapOrFetch(snapshot.skillsAfter,          `/api/learning/${cid}/skills/ai-engineer/after`, "skills",          "skillsAfter"),
      swapOrFetch(snapshot.marketRelevanceAfter, `/api/learning/${cid}/market-relevance/after`,   "marketRelevance", "marketRelevanceAfter"),
      swapOrFetch(snapshot.careerGrowthAfter,    `/api/learning/${cid}/career-growth/after`,      "careerGrowth",    "careerGrowthAfter"),
      swapOrFetch(snapshot.jobsAfter,            `/api/learning/${cid}/jobs/after?limit=6`,       "jobs",            "jobsAfter"),
    ]);

    saveLearningCompleted();

    return true;
  } catch (err) {
    console.error("[mcpBridge] completeLearning error:", err);
    return undefined;
  }
}

export async function fetchJobApplicants(
  postingId: string,
  includeProfile = true,
): Promise<unknown> {
  try {
    const res = await fetch("/api/invoke/get_job_applicants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        posting_id: postingId,
        include_profile: includeProfile,
        limit: 100,
      }),
    });
    if (!res.ok) {
      console.error(`[mcpBridge] fetchJobApplicants failed:`, res.status);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("[mcpBridge] fetchJobApplicants error:", err);
    return null;
  }
}

export function patchSiteFunctions() {
  const siteFns = (
    window as unknown as { UIFrameworkSiteFunctions?: Record<string, unknown> }
  ).UIFrameworkSiteFunctions;
  if (!siteFns) return;
  siteFns.fetchJobs = fetchJobs;
  siteFns.fetchSkills = fetchSkills;
  siteFns.fetchCandidate = fetchCandidate;
  siteFns.fetchCareerGrowth = fetchCareerGrowth;
  siteFns.fetchMarketRelevance = fetchMarketRelevance;
  siteFns.completeLearning = completeLearning;
  siteFns.syncLearningState = syncLearningState;
  siteFns.fetchJobApplicants = fetchJobApplicants;
}
