import { saveVisitorSession, getVisitorSession, saveLearningCompleted, clearLearningCompleted } from "@/utils/visitorMemory";
import { loadIntoCache, readCache, type McpCache } from "@/platform/mcpCacheBridge";

const inFlight = new Set<string>();

/** Hosted/static deploys (e.g. Mobeus) often omit POST /api/invoke/* — stop retrying after 405/404. */
const skippedInvokeTools = new Set<string>();

// ── MCP server URL (baked in at build time via NEXT_PUBLIC_MCP_SERVER_URL) ─────────────────────
// Strip a trailing "/mcp" so the env var can be either the base domain or the full MCP path.
// e.g. "https://train-v1.rapidprototype.ai" or "https://train-v1.rapidprototype.ai/mcp"
const MCP_SERVER_URL = (process.env.NEXT_PUBLIC_MCP_SERVER_URL ?? "").replace(/\/mcp\/?$/, "").trim();
const MCP_ORIGIN = (() => {
  if (!MCP_SERVER_URL) return "";
  try { return new URL(MCP_SERVER_URL).origin; } catch { return MCP_SERVER_URL; }
})();

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────

/**
 * Extracts a non-empty candidate_id UUID from various response shapes returned by find_candidate.
 * Checks: top-level candidate_id / id, then data.candidate_id / data.id, then data.candidate.id.
 */
function extractCandidateId(data: Record<string, unknown>): string | null {
  for (const key of ["candidate_id", "id"] as const) {
    const v = data[key];
    if (typeof v === "string" && v) return v;
  }
  const inner = data.data;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    const d = inner as Record<string, unknown>;
    for (const key of ["candidate_id", "id"] as const) {
      const v = d[key];
      if (typeof v === "string" && v) return v;
    }
    const nested = d.candidate;
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const v = (nested as Record<string, unknown>).id;
      if (typeof v === "string" && v) return v;
    }
  }
  return null;
}

/**
 * Unwraps `{ success, data: { ... } }` or `{ result: { ... } }` wrappers
 * to get the actual candidate record.
 */
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

// ── Browser-side MCP SSE client ──────────────────────────────────────────────────────────────────
//
// Implements the MCP SSE + JSON-RPC 2.0 session lifecycle directly in the browser.
// This mirrors trainco-v1/server/mcpInvoke.ts (which runs server-side in Express).
// Works because the MCP server uses allow_origins=["*"] by default.
//
// Protocol:
//   1. Open EventSource to {MCP_SERVER_URL}/mcp/sse — server sends "endpoint" event with path
//   2. POST "initialize" JSON-RPC to that path
//   3. POST "notifications/initialized" (no-id) then wait 200ms
//   4. POST "tools/call" → read result from SSE "message" event → close SSE
//
const MCP_SSE_TIMEOUT_MS = 15_000;

interface JsonRpcMsg {
  jsonrpc: string;
  id?: number;
  result?: unknown;
  error?: { code: number; message: string };
}

async function invokeViaMcpSse(
  toolName: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  if (!MCP_SERVER_URL) return null;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: unknown) => {
      if (settled) return;
      settled = true;
      es.close();
      clearTimeout(timer);
      resolve(value);
    };

    const timer = setTimeout(() => {
      console.warn(`[mcpBridge] MCP SSE timeout for ${toolName}`);
      finish(null);
    }, MCP_SSE_TIMEOUT_MS);

    const es = new EventSource(`${MCP_SERVER_URL}/mcp/sse`);
    let messagesEndpoint = "";
    let nextId = 1;
    const pending = new Map<number, (msg: JsonRpcMsg) => void>();

    const postMsg = (method: string, params: Record<string, unknown>, id?: number): void => {
      const body: Record<string, unknown> = { jsonrpc: "2.0", method, params };
      if (id !== undefined) body.id = id;
      fetch(messagesEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).catch(() => finish(null));
    };

    const rpc = (
      method: string,
      params: Record<string, unknown>,
      needsResponse: boolean,
    ): Promise<JsonRpcMsg | void> => {
      if (needsResponse) {
        const id = nextId++;
        return new Promise<JsonRpcMsg>((res) => {
          pending.set(id, res);
          postMsg(method, params, id);
        });
      }
      postMsg(method, params);
      return Promise.resolve();
    };

    es.addEventListener("endpoint", (e: Event) => {
      const path = (e as MessageEvent).data?.trim() ?? "";
      messagesEndpoint = path.startsWith("http") ? path : `${MCP_ORIGIN}${path}`;

      void (async () => {
        try {
          // Step 1: initialize
          await rpc(
            "initialize",
            {
              protocolVersion: "2024-11-05",
              capabilities: {},
              clientInfo: { name: "trainco-bridge", version: "1.0" },
            },
            true,
          );

          // Step 2: initialized notification
          await rpc("notifications/initialized", {}, false);
          await new Promise<void>((r) => setTimeout(r, 200));

          // Step 3: call tool
          const toolResp = await rpc(
            "tools/call",
            { name: toolName, arguments: args },
            true,
          ) as JsonRpcMsg;

          if (toolResp.error) {
            console.error(`[mcpBridge] MCP tool ${toolName} error:`, toolResp.error);
            finish(null);
            return;
          }

          const content = (toolResp.result as { content?: { type: string; text: string }[] })?.content;
          if (!content?.length) {
            console.error(`[mcpBridge] MCP tool ${toolName}: empty response`);
            finish(null);
            return;
          }

          const text = content.map((c) => c.text ?? "").join("");
          try {
            finish(JSON.parse(text));
          } catch {
            finish(text);
          }
        } catch (err) {
          console.error(`[mcpBridge] MCP SSE invoke error for ${toolName}:`, err);
          finish(null);
        }
      })();
    });

    es.addEventListener("message", (e: Event) => {
      try {
        const msg = JSON.parse((e as MessageEvent).data) as JsonRpcMsg;
        if (msg.id !== undefined && pending.has(msg.id)) {
          const cb = pending.get(msg.id)!;
          pending.delete(msg.id);
          cb(msg);
        }
      } catch { /* ignore non-JSON SSE frames */ }
    });

    es.onerror = () => {
      console.warn(`[mcpBridge] MCP SSE connection error for ${toolName}`);
      finish(null);
    };
  });
}

// ── LinkedIn onboarding: direct candidate fetch (no LLM involvement) ─────────────────────────────
//
// Calls find_candidate → get_candidate directly from the browser.
// Primary path: browser-side MCP SSE (EventSource + JSON-RPC 2.0) via NEXT_PUBLIC_MCP_SERVER_URL.
// Fallback path: /api/invoke/ REST proxy (works in trainco-v1 Express server deployments).
//
// Flow:
//   1. find_candidate(email) → extract candidate_id
//   2. get_candidate(candidate_id) → load full profile into cache + save session
//
// Returns the candidate_id on success, null on any failure.
// Called from the linkedin-continue event handler in usePhaseFlow.ts so the data
// is ready before the LLM receives the [SYSTEM] signal to call navigateToSection.
//
export async function fetchCandidateByEmail(email: string): Promise<string | null> {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) return null;

  try {
    // ── Step 1: find_candidate ────────────────────────────────────────────────
    let findData: Record<string, unknown> | null = null;

    if (MCP_SERVER_URL) {
      console.log("[mcpBridge] find_candidate via MCP SSE:", trimmedEmail);
      const result = await invokeViaMcpSse("find_candidate", { email: trimmedEmail });
      if (result && typeof result === "object" && !Array.isArray(result)) {
        findData = result as Record<string, unknown>;
        console.log("[mcpBridge] find_candidate MCP SSE result:", findData);
      }
    }

    if (!findData) {
      // Fallback: /api/invoke/ REST proxy (trainco-v1 server or Mobeus invoke route)
      console.log("[mcpBridge] find_candidate fallback via /api/invoke/:", trimmedEmail);
      const findRes = await fetch("/api/invoke/find_candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      if (!findRes.ok) {
        console.error("[mcpBridge] find_candidate /api/invoke/ failed:", findRes.status);
        return null;
      }
      findData = await findRes.json() as Record<string, unknown>;
    }

    const candidateId = extractCandidateId(findData);
    if (!candidateId) {
      console.error("[mcpBridge] find_candidate: could not extract candidate_id from", findData);
      return null;
    }

    console.log("[mcpBridge] find_candidate resolved candidate_id:", candidateId);

    // ── Step 2: get_candidate ─────────────────────────────────────────────────
    if (MCP_SERVER_URL) {
      console.log("[mcpBridge] get_candidate via MCP SSE:", candidateId);
      const result = await invokeViaMcpSse("get_candidate", { candidate_id: candidateId });
      if (result && typeof result === "object") {
        const candidate = unwrapCandidateResponse(result);
        loadIntoCache("candidate", candidate);
        saveVisitorSession(candidateId);
        console.log("[mcpBridge] get_candidate MCP SSE loaded into cache for", candidateId);
        return candidateId;
      }
    }

    // Fallback: existing fetchCandidate (/api/invoke/get_candidate)
    const fetched = await fetchCandidate(candidateId);
    if (!fetched) {
      console.error("[mcpBridge] get_candidate fallback also failed for", candidateId);
      return null;
    }

    return candidateId;
  } catch (err) {
    console.error("[mcpBridge] fetchCandidateByEmail error:", err);
    return null;
  }
}

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

export async function fetchCandidate(candidateId: string): Promise<true | undefined> {
  if (!candidateId?.trim()) return undefined;
  const cid = candidateId.trim();
  if (inFlight.has("candidate")) return undefined;
  inFlight.add("candidate");
  try {
    // Primary: browser-side MCP SSE (works when NEXT_PUBLIC_MCP_SERVER_URL is set)
    if (MCP_SERVER_URL) {
      const result = await invokeViaMcpSse("get_candidate", { candidate_id: cid });
      if (result && typeof result === "object") {
        const candidate = unwrapCandidateResponse(result);
        loadIntoCache("candidate", candidate);
        saveVisitorSession(cid);
        return true;
      }
    }

    // Fallback: /api/invoke/get_candidate (trainco-v1 Express server or Mobeus invoke route)
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
