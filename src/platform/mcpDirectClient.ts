/**
 * mcpDirectClient — direct MCP SSE client for the LinkedIn onboarding flow.
 *
 * Connects to the MCP server at train-v1.rapidprototype.ai using the
 * SSE + JSON-RPC 2.0 protocol, runs the full LinkedIn onboarding tool
 * sequence (find_candidate → get_candidate → get_jobs_by_skills →
 * get_skill_progression), and returns the results for the SPA to cache
 * and navigate to CandidateSheet — bypassing Mobeus for data fetches.
 *
 * Protocol summary:
 *   1. GET /mcp/sse                → extracts session_id from first SSE event
 *   2. POST /mcp/messages?…       → initialize
 *   3. POST /mcp/messages?…       → notifications/initialized (+ 200ms)
 *   4. POST /mcp/messages?… (×N)  → tools/call — responses come back on SSE stream
 */

const MCP_BASE =
  (process.env.NEXT_PUBLIC_MCP_BASE_URL ?? "https://train-v1.rapidprototype.ai/mcp").replace(
    /\/$/,
    "",
  );

const INIT_WAIT_MS = 250; // slight buffer after notifications/initialized
const TOOL_TIMEOUT_MS = 15_000; // max wait per tool response

export interface McpLinkedInResult {
  candidateId: string;
  candidate: Record<string, unknown>;
  jobs: unknown[] | null;
  skills: unknown | null;
}

// ─── Low-level helpers ────────────────────────────────────────────────────────

/** Opens an SSE connection and returns the extracted session_id plus the EventSource. */
function openSseSession(): Promise<{ sessionId: string; es: EventSource }> {
  return new Promise((resolve, reject) => {
    const es = new EventSource(`${MCP_BASE}/sse`);
    const timeout = setTimeout(() => {
      es.close();
      reject(new Error("[mcpDirect] Timed out waiting for SSE session_id"));
    }, 10_000);

    es.addEventListener("endpoint", (evt) => {
      clearTimeout(timeout);
      const raw = (evt as MessageEvent).data as string;
      // data is like "/mcp/messages?session_id=abc-123"
      const match = /session_id=([^&\s]+)/.exec(raw);
      if (!match) {
        es.close();
        reject(new Error(`[mcpDirect] Could not parse session_id from: ${raw}`));
        return;
      }
      resolve({ sessionId: match[1], es });
    });

    es.onerror = (e) => {
      clearTimeout(timeout);
      es.close();
      reject(new Error(`[mcpDirect] SSE connection error: ${JSON.stringify(e)}`));
    };
  });
}

/** Sends a single JSON-RPC 2.0 message to the MCP messages endpoint. */
async function sendMessage(
  sessionId: string,
  body: Record<string, unknown>,
): Promise<void> {
  const res = await fetch(`${MCP_BASE}/messages?session_id=${sessionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  // The HTTP response body is empty (202 Accepted); responses come on the SSE stream.
  if (!res.ok && res.status !== 202) {
    throw new Error(`[mcpDirect] POST failed: ${res.status} ${res.statusText}`);
  }
}

/** Waits for a JSON-RPC response with the given id on the EventSource. */
function waitForResponse(es: EventSource, id: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`[mcpDirect] Timed out waiting for response id=${id}`));
    }, TOOL_TIMEOUT_MS);

    const onMessage = (evt: MessageEvent) => {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(evt.data as string) as Record<string, unknown>;
      } catch {
        return; // not our message
      }
      if (parsed.id !== id) return;

      clearTimeout(timeout);
      es.removeEventListener("message", onMessage as EventListener);

      if (parsed.error) {
        reject(new Error(`[mcpDirect] RPC error id=${id}: ${JSON.stringify(parsed.error)}`));
        return;
      }
      resolve(parsed.result);
    };

    es.addEventListener("message", onMessage as EventListener);
  });
}

/** Sends a tools/call and resolves with the parsed result content. */
async function callTool(
  es: EventSource,
  sessionId: string,
  id: number,
  toolName: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  const [result] = await Promise.all([
    waitForResponse(es, id),
    sendMessage(sessionId, {
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: { name: toolName, arguments: args },
    }),
  ]);
  return result;
}

// ─── Result parsers ───────────────────────────────────────────────────────────

function parseToolResult(result: unknown): unknown {
  if (!result || typeof result !== "object") return result;
  const r = result as Record<string, unknown>;
  const content = r.content;
  if (!Array.isArray(content) || content.length === 0) return r;
  const first = content[0] as Record<string, unknown>;
  if (first?.type === "text" && typeof first.text === "string") {
    try {
      return JSON.parse(first.text);
    } catch {
      return first.text;
    }
  }
  return content;
}

function extractCandidateId(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "";
  const obj = raw as Record<string, unknown>;
  const id =
    (obj.candidate_id as string) ||
    ((obj.data as Record<string, unknown> | undefined)?.id as string) ||
    ((obj.data as Record<string, unknown> | undefined)?.candidate_id as string) ||
    ((obj.data as Record<string, unknown> | undefined)
      ?.candidate as Record<string, unknown> | undefined)?.id as string ||
    "";
  return typeof id === "string" ? id : "";
}

function unwrapCandidate(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  for (const key of ["data", "result", "candidate"] as const) {
    const inner = obj[key];
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      return inner as Record<string, unknown>;
    }
  }
  return obj;
}

function extractJobsArray(raw: unknown): unknown[] | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.jobs)) return obj.jobs;
    const data = obj.data;
    if (data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      if (Array.isArray(d.jobs)) return d.jobs;
    }
    if (Array.isArray(obj.results)) return obj.results;
    if (Array.isArray(obj.data)) return obj.data as unknown[];
  }
  return null;
}

// ─── Main public API ──────────────────────────────────────────────────────────

/**
 * Runs the full LinkedIn onboarding MCP sequence:
 *   find_candidate → get_candidate → get_jobs_by_skills → get_skill_progression
 *
 * Returns structured data ready to load into the SPA cache.
 */
export async function runLinkedInOnboarding(
  email: string,
): Promise<McpLinkedInResult> {
  let es: EventSource | null = null;

  try {
    // Step 1 — open SSE, get session
    const session = await openSseSession();
    es = session.es;
    const { sessionId } = session;

    console.log("[mcpDirect] Session opened:", sessionId);

    // Step 2 — initialize
    const [_initResult] = await Promise.all([
      waitForResponse(es, 1),
      sendMessage(sessionId, {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "trainco-spa", version: "1.0" },
        },
      }),
    ]);

    // Step 3 — notifications/initialized (fire-and-forget, no id)
    await sendMessage(sessionId, {
      jsonrpc: "2.0",
      method: "notifications/initialized",
      params: {},
    });

    // Important: wait after initialized to avoid -32602 errors
    await new Promise((r) => setTimeout(r, INIT_WAIT_MS));

    // Step 4 — find_candidate
    const findRaw = await callTool(es, sessionId, 2, "find_candidate", { email });
    const findResult = parseToolResult(findRaw) as Record<string, unknown>;
    const candidateId = extractCandidateId(findResult);

    if (!candidateId) {
      throw new Error(
        `[mcpDirect] find_candidate returned no candidate_id. Raw: ${JSON.stringify(findResult)}`,
      );
    }

    console.log("[mcpDirect] candidate_id:", candidateId);

    // Step 5 — get_candidate (sequential: must follow find_candidate)
    const getResult = await callTool(es, sessionId, 3, "get_candidate", {
      candidate_id: candidateId,
    });
    const candidate = unwrapCandidate(parseToolResult(getResult));

    console.log("[mcpDirect] get_candidate done");

    // Step 6 — get_jobs_by_skills (parallel-safe with skills fetch)
    let jobs: unknown[] | null = null;
    let skills: unknown | null = null;

    const [jobsResult, skillsResult] = await Promise.allSettled([
      callTool(es, sessionId, 4, "get_jobs_by_skills", {
        candidate_id: candidateId,
        limit: 6,
      }),
      callTool(es, sessionId, 5, "get_skill_progression", {
        role_id: "ai-engineer",
      }),
    ]);

    if (jobsResult.status === "fulfilled") {
      jobs = extractJobsArray(parseToolResult(jobsResult.value));
    } else {
      console.warn("[mcpDirect] get_jobs_by_skills failed:", jobsResult.reason);
    }

    if (skillsResult.status === "fulfilled") {
      skills = parseToolResult(skillsResult.value);
    } else {
      console.warn("[mcpDirect] get_skill_progression failed:", skillsResult.reason);
    }

    return { candidateId, candidate, jobs, skills };
  } finally {
    es?.close();
  }
}
