import { saveVisitorSession, getVisitorSession, saveLearningCompleted, clearLearningCompleted } from "@/utils/visitorMemory";
import { loadIntoCache, readCache, type McpCache } from "@/platform/mcpCacheBridge";

const inFlight = new Set<string>();

// ─── Remote invoke ─────────────────────────────────────────────────────────────
// All MCP tool calls go directly to train-v1.rapidprototype.ai/api/invoke/:toolName.
// Same-origin /api/invoke/* returns 405 on Mobeus static deploys.
//
// Uses credentials: 'include' so the Mobeus session cookie is forwarded — the same
// cookie the Mobeus SDK uses when talking to train-v1 cross-origin.
// Use || instead of ?? to handle empty strings from next.config.ts
const MCP_BASE = (
  (process.env.MCP_SERVER_URL || "https://train-v1.rapidprototype.ai/mcp").replace(/\/mcp\/?$/, "")
);

console.info(`[mcpBridge] remote invoke base: ${MCP_BASE}`);

/**
 * Parse a Response as JSON only if the Content-Type is JSON-like.
 * Returns null (instead of throwing SyntaxError) when the server sends HTML
 * (e.g. a login redirect or 404 page disguised as 200 OK on static deploys).
 */
async function parseJsonSafe(res: Response, label: string): Promise<unknown> {
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("json") && !ct.includes("text/plain")) {
    const text = await res.text().catch(() => "");
    console.warn(`[mcpBridge] ${label}: expected JSON but got ${ct || "no content-type"} — ${text.slice(0, 120)}`);
    return null;
  }
  return res.json();
}

async function invokeRemote(
  toolName: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  const url = `${MCP_BASE}/api/invoke/${toolName}`;
  console.info(`[mcpBridge] invokeRemote → ${url}`, args);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Remote invoke ${toolName} failed: ${res.status}`);
  const data = await parseJsonSafe(res, toolName);
  if (data === null) throw new Error(`Remote invoke ${toolName}: non-JSON response`);
  return data;
}

async function invokeBridge(
  toolName: string,
  cacheKey: keyof McpCache,
  args: Record<string, unknown>,
  transform?: (data: unknown) => unknown,
): Promise<true | undefined> {
  try {
    const data = await invokeRemote(toolName, args);
    loadIntoCache(cacheKey, transform ? transform(data) : data);
    return true;
  } catch (err) {
    console.error(`[mcpBridge] ${toolName} failed:`, err);
    return undefined;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

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

/**
 * Extracts `candidate_id` from a `find_candidate` API response.
 * Handles both flat `{ candidate_id }` and wrapped `{ data: { candidate_id } }` shapes.
 */
function extractCandidateId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const obj = payload as Record<string, unknown>;
  if (typeof obj.candidate_id === "string" && obj.candidate_id) return obj.candidate_id;
  if (typeof obj.candidateId === "string" && obj.candidateId) return obj.candidateId;
  for (const key of ["data", "result"] as const) {
    const inner = obj[key];
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      const rec = inner as Record<string, unknown>;
      if (typeof rec.candidate_id === "string" && rec.candidate_id) return rec.candidate_id;
      if (typeof rec.candidateId === "string" && rec.candidateId) return rec.candidateId;
    }
  }
  return undefined;
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
      if (Array.isArray(d.results)) return d.results;
      const result = d.result;
      if (result && typeof result === "object") {
        const r = result as Record<string, unknown>;
        if (Array.isArray(r.jobs)) return r.jobs;
        if (Array.isArray(r.results)) return r.results;
        if (Array.isArray(r.data)) return r.data;
      }
    }

    const result = obj.result;
    if (result && typeof result === "object") {
      const r = result as Record<string, unknown>;
      if (Array.isArray(r.jobs)) return r.jobs;
      if (Array.isArray(r.results)) return r.results;
      if (Array.isArray(r.data)) return r.data;
    }

    if (Array.isArray(obj.results)) return obj.results;
    if (Array.isArray(obj.data)) return obj.data;
  }
  return [];
}

// ── getCandidate / findCandidate ───────────────────────────────────────────────

/**
 * UI-side bridge for `get_candidate`.
 * Loads the full candidate record into the cache and persists the session.
 * Called automatically by `findCandidate`; can also be called directly when
 * a `candidate_id` is already known (e.g. return-visit session restore).
 */
export async function getCandidate(candidateId: string): Promise<true | undefined> {
  if (!candidateId?.trim()) return undefined;
  const cid = candidateId.trim();
  if (inFlight.has("candidate")) return undefined;
  inFlight.add("candidate");
  try {
    const ok = await invokeBridge(
      "get_candidate",
      "candidate",
      { candidate_id: cid },
      unwrapCandidateResponse,
    );
    if (ok) saveVisitorSession(cid);
    return ok;
  } finally {
    inFlight.delete("candidate");
  }
}

/** @deprecated Use {@link getCandidate} instead. Kept for backwards-compatibility. */
export const fetchCandidate = getCandidate;

/**
 * UI-side bridge for `find_candidate`.
 *
 * Resolves an email address to a `candidate_id`, fetches the full candidate
 * record (awaited so cache is populated before returning), then kicks off
 * parallel hydration of jobs and skills fire-and-forget.
 *
 * Callers can send the "candidate ready" signal immediately after this resolves
 * and be confident that `cache.candidate` contains the full profile data.
 *
 * Returns the resolved `candidate_id`, or `undefined` on failure.
 */
export async function findCandidate(email: string): Promise<string | undefined> {
  const trimmedEmail = email?.trim();
  if (!trimmedEmail) return undefined;
  if (inFlight.has("findCandidate")) return undefined;
  inFlight.add("findCandidate");
  try {
    let raw: unknown;
    try {
      raw = await invokeRemote("find_candidate", { email: trimmedEmail });
    } catch (err) {
      console.error("[mcpBridge] find_candidate failed:", err);
      return undefined;
    }

    const candidateId = extractCandidateId(raw);
    if (!candidateId) {
      console.warn("[mcpBridge] find_candidate: could not extract candidate_id", raw);
      return undefined;
    }

    console.info("[mcpBridge] findCandidate resolved:", candidateId);
    saveVisitorSession(candidateId);

    // Await getCandidate so cache.candidate is fully populated before we return.
    // CandidateSheet reads from this cache — it must be ready before the caller
    // sends the "candidate ready" signal to the agent.
    await getCandidate(candidateId);

    // Jobs and skills load progressively — fire-and-forget is fine for CardStack.
    void fetchJobs(candidateId);
    void fetchSkills("ai-engineer");

    return candidateId;
  } finally {
    inFlight.delete("findCandidate");
  }
}

// ── fetchJobs ──────────────────────────────────────────────────────────────────

export async function fetchJobs(candidateId: string): Promise<true | undefined> {
  if (!candidateId?.trim()) return undefined;
  if (inFlight.has("jobs")) return undefined;
  inFlight.add("jobs");
  try {
    const cid = candidateId.trim();
    const sess = getVisitorSession();
    if (sess?.learningCompleted) {
      void fetch(`/api/learning/${cid}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).catch(() => {});
      const res = await fetch(`/api/learning/${cid}/jobs/after?limit=6`);
      if (res.ok) {
        const data = await parseJsonSafe(res, "jobs/after");
        if (data) { loadIntoCache("jobs", data); return true; }
      }
    }
    return await invokeBridge("get_jobs_by_skills", "jobs", { candidate_id: cid, limit: 6 });
  } catch (err) {
    console.error("[mcpBridge] fetchJobs error:", err);
    return undefined;
  } finally {
    inFlight.delete("jobs");
  }
}

// ── fetchSkills ────────────────────────────────────────────────────────────────

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
        const data = await parseJsonSafe(res, "skills");
        if (data) {
          console.info("[mcpBridge] skills raw response:", JSON.stringify(data).slice(0, 500));
          loadIntoCache("skills", data);
          return true;
        }
      }
    }
    return await invokeBridge("get_skill_progression", "skills", { role_id: roleId.trim() });
  } catch (err) {
    console.error("[mcpBridge] fetchSkills error:", err);
    return undefined;
  } finally {
    inFlight.delete("skills");
  }
}

// ── fetchCareerGrowth ──────────────────────────────────────────────────────────

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
        const data = await parseJsonSafe(res, "careerGrowth");
        if (data) {
          console.info("[mcpBridge] careerGrowth raw response:", JSON.stringify(data).slice(0, 500));
          loadIntoCache("careerGrowth", data);
          return true;
        }
      }
    }
    return await invokeBridge("get_career_growth", "careerGrowth", { candidate_id: candidateId.trim() });
  } catch (err) {
    console.error("[mcpBridge] fetchCareerGrowth error:", err);
    return undefined;
  } finally {
    inFlight.delete("careerGrowth");
  }
}

// ── fetchMarketRelevance ───────────────────────────────────────────────────────

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
        const data = await parseJsonSafe(res, "marketRelevance");
        if (data) {
          console.info("[mcpBridge] marketRelevance raw response:", JSON.stringify(data).slice(0, 500));
          loadIntoCache("marketRelevance", data);
          return true;
        }
      }
    }
    return await invokeBridge("get_market_relevance", "marketRelevance", { candidate_id: candidateId.trim() });
  } catch (err) {
    console.error("[mcpBridge] fetchMarketRelevance error:", err);
    return undefined;
  } finally {
    inFlight.delete("marketRelevance");
  }
}

// ── fetchJsonSafe / swapOrFetch ────────────────────────────────────────────────

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

// ── syncLearningState ──────────────────────────────────────────────────────────

export async function syncLearningState(candidateId: string): Promise<boolean> {
  if (!candidateId?.trim()) return false;
  try {
    const sess = getVisitorSession();
    if (!sess?.learningCompleted) return false;
    const res = await fetch(`/api/learning/${candidateId.trim()}/status`);
    if (!res.ok) return false;
    const data = await res.json() as { completed: boolean };
    if (!data.completed && sess.learningCompleted) {
      console.log("[mcpBridge] Backend state reset detected. Clearing localStorage learning flag.");
      clearLearningCompleted();
      return true;
    }
    return false;
  } catch (err) {
    console.warn("[mcpBridge] syncLearningState failed:", err);
    return false;
  }
}

// ── prefetchAfterLearning ──────────────────────────────────────────────────────

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

// ── completeLearning ───────────────────────────────────────────────────────────

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

// ── fetchJobApplicants ─────────────────────────────────────────────────────────

export async function fetchJobApplicants(
  postingId: string,
  includeProfile = true,
): Promise<unknown> {
  try {
    return await invokeRemote("get_job_applicants", {
      posting_id: postingId,
      include_profile: includeProfile,
      limit: 100,
    });
  } catch (err) {
    console.error("[mcpBridge] fetchJobApplicants error:", err);
    return null;
  }
}

// ── patchSiteFunctions ─────────────────────────────────────────────────────────

export function patchSiteFunctions() {
  const siteFns = (
    window as unknown as { UIFrameworkSiteFunctions?: Record<string, unknown> }
  ).UIFrameworkSiteFunctions;
  if (!siteFns) return;
  siteFns.findCandidate = findCandidate;
  siteFns.getCandidate = getCandidate;
  siteFns.fetchJobs = fetchJobs;
  siteFns.fetchSkills = fetchSkills;
  siteFns.fetchCandidate = fetchCandidate;
  siteFns.fetchCareerGrowth = fetchCareerGrowth;
  siteFns.fetchMarketRelevance = fetchMarketRelevance;
  siteFns.completeLearning = completeLearning;
  siteFns.syncLearningState = syncLearningState;
  siteFns.fetchJobApplicants = fetchJobApplicants;
}
