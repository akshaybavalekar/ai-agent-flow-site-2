/**
 * mcpDirectClient — direct MCP tool calls via the Mobeus /api/invoke proxy.
 *
 * Uses simple REST: POST /api/invoke/{toolName}
 * No SSE, no session management, no find_candidate step.
 *
 * For the LinkedIn demo path the candidate ID is hardcoded
 * (prototype — always the same seeded demo candidate).
 * All /api/invoke/* routes are proxied by Mobeus automatically.
 */

const MCP_API_BASE = (
  process.env.NEXT_PUBLIC_MCP_API_BASE ?? ""
).replace(/\/$/, "");

/**
 * Hardcoded demo candidate ID for the LinkedIn prototype path.
 * find_candidate is skipped — we go straight to get_candidate with this ID.
 */
export const LINKEDIN_DEMO_CANDIDATE_ID = "943cde97-e51f-4f68-bad6-14f50359700b";

async function invokeToolDirect(
  toolName: string,
  args: Record<string, unknown>,
): Promise<unknown> {
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

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Calls get_candidate, returns the normalized candidate object.
 */
export async function getCandidateDirect(
  candidateId: string,
): Promise<Record<string, unknown>> {
  console.log("[mcpDirect] get_candidate", candidateId);
  const raw = (await invokeToolDirect("get_candidate", {
    candidate_id: candidateId,
  })) as Record<string, unknown>;
  for (const key of ["data", "result", "candidate"] as const) {
    const inner = raw[key];
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      return inner as Record<string, unknown>;
    }
  }
  return raw;
}

/**
 * Calls get_jobs_by_skills, returns jobs array (or null on failure).
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
 * Calls get_skill_progression (non-fatal, returns null on failure).
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
 * Always true — direct calls use Mobeus /api/invoke/* proxy (relative URLs).
 */
export function isMcpDirectAvailable(): boolean {
  return true;
}
