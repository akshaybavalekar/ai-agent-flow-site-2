/**
 * mcpDirectClient — simple REST client for direct MCP tool calls.
 *
 * Uses the Express-style proxy endpoint on the MCP server:
 *   POST {NEXT_PUBLIC_MCP_API_BASE}/api/invoke/{toolName}
 *
 * No SSE, no session management — just a single POST per tool.
 * This matches the trainco-v1 bridge pattern but with an absolute base URL
 * so it works from a static-export SPA (no local /api/invoke/* routes).
 *
 * The base URL is configured via NEXT_PUBLIC_MCP_API_BASE env var.
 * Example: https://train-v1.rapidprototype.ai
 */

const MCP_API_BASE = (
  process.env.NEXT_PUBLIC_MCP_API_BASE ?? ""
).replace(/\/$/, "");

async function invokeToolDirect(
  toolName: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  if (!MCP_API_BASE) {
    throw new Error(
      `[mcpDirect] NEXT_PUBLIC_MCP_API_BASE is not set. Cannot call ${toolName} directly.`,
    );
  }
  const res = await fetch(`${MCP_API_BASE}/api/invoke/${toolName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    throw new Error(
      `[mcpDirect] ${toolName} failed: ${res.status} ${res.statusText}`,
    );
  }
  return res.json();
}

// ─── Candidate-id extraction ─────────────────────────────────────────────────

function extractCandidateId(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "";
  const obj = raw as Record<string, unknown>;
  const id =
    (obj.candidate_id as string | undefined) ??
    ((obj.data as Record<string, unknown> | undefined)?.id as string | undefined) ??
    ((obj.data as Record<string, unknown> | undefined)?.candidate_id as string | undefined) ??
    (
      (obj.data as Record<string, unknown> | undefined)
        ?.candidate as Record<string, unknown> | undefined
    )?.id as string | undefined ??
    "";
  return typeof id === "string" ? id : "";
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Calls find_candidate directly, returns the UUID string.
 * Throws if the MCP server returns an error or no id.
 */
export async function findCandidateDirect(email: string): Promise<string> {
  console.log("[mcpDirect] find_candidate", email);
  const raw = await invokeToolDirect("find_candidate", { email });
  const id = extractCandidateId(raw);
  if (!id) {
    throw new Error(
      `[mcpDirect] find_candidate returned no candidate_id. Raw: ${JSON.stringify(raw)}`,
    );
  }
  console.log("[mcpDirect] candidate_id:", id);
  return id;
}

/**
 * Calls get_candidate directly, returns the normalized candidate object.
 */
export async function getCandidateDirect(
  candidateId: string,
): Promise<Record<string, unknown>> {
  console.log("[mcpDirect] get_candidate", candidateId);
  const raw = (await invokeToolDirect("get_candidate", {
    candidate_id: candidateId,
  })) as Record<string, unknown>;
  // Unwrap common API envelopes (data, result, candidate)
  for (const key of ["data", "result", "candidate"] as const) {
    const inner = raw[key];
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      return inner as Record<string, unknown>;
    }
  }
  return raw;
}

/**
 * Calls get_jobs_by_skills directly, returns jobs array (or null on failure).
 */
export async function getJobsBySkillsDirect(
  candidateId: string,
  limit = 6,
): Promise<unknown[] | null> {
  try {
    console.log("[mcpDirect] get_jobs_by_skills", candidateId);
    const raw = await invokeToolDirect("get_jobs_by_skills", {
      candidate_id: candidateId,
      limit,
    });
    if (!raw) return null;
    if (Array.isArray(raw)) return raw;
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.jobs)) return obj.jobs;
    const data = obj.data;
    if (data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      if (Array.isArray(d.jobs)) return d.jobs;
    }
    if (Array.isArray(obj.results)) return obj.results;
    return null;
  } catch (err) {
    console.warn("[mcpDirect] get_jobs_by_skills failed (non-fatal):", err);
    return null;
  }
}

/**
 * Calls get_skill_progression directly (non-fatal, returns null on failure).
 */
export async function getSkillProgressionDirect(
  roleId: string,
): Promise<unknown | null> {
  try {
    console.log("[mcpDirect] get_skill_progression", roleId);
    return await invokeToolDirect("get_skill_progression", { role_id: roleId });
  } catch (err) {
    console.warn("[mcpDirect] get_skill_progression failed (non-fatal):", err);
    return null;
  }
}

/**
 * Returns true if the NEXT_PUBLIC_MCP_API_BASE env var is configured.
 * Used to decide whether to attempt direct calls or fall back to the agent.
 */
export function isMcpDirectAvailable(): boolean {
  return !!MCP_API_BASE;
}
