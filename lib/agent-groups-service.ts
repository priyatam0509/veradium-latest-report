"use client"

/**
 * Agent Groups service.
 *
 * Named collections of agents used to speed up the Agent filter — a reporting
 * manager can pick a group instead of selecting agents one by one.
 *
 * Storage has two modes with an identical public interface:
 *  - BACKEND (shared/global): when an endpoint is configured, groups are stored
 *    in DynamoDB via API Gateway, so any user's group is visible to everyone.
 *    Deploy infra/agent-groups-cft.yaml, then set NEXT_PUBLIC_AGENT_GROUPS_API
 *    to the stack's AgentGroupsEndpoint output (or paste it into API_BASE below).
 *  - LOCAL (fallback): when no endpoint is configured, groups are stored in the
 *    browser's localStorage (per-device only).
 */

export interface AgentGroup {
  id: string
  name: string
  /** Agent UIDs (item_value) sent to the reporting queries. */
  agents: string[]
  /** Display names, cached so the table/label don't need a lookup. */
  agentNames: string[]
  /** Email of the user who created the group (backend-stamped). */
  createdBy?: string
  /** Region the group belongs to (creator's region; backend-stamped). */
  region?: string
  createdAt?: string
  updatedAt?: string
}

/**
 * Full endpoint to the deployed API, e.g.
 * https://xxxx.execute-api.us-east-1.amazonaws.com/prod/agent-groups
 * Prefer the env var; you can also hard-code the CFT output as the fallback.
 */
const API_BASE = (
  process.env.NEXT_PUBLIC_AGENT_GROUPS_API ||
  "https://c2zhm7im0j.execute-api.us-east-1.amazonaws.com/prod/agent-groups"
).replace(/\/$/, "")
const USE_API = API_BASE.length > 0

const STORAGE_KEY = "aws_reports_agent_groups"
/** Fired on the window whenever groups change, so open dropdowns can refresh. */
export const AGENT_GROUPS_EVENT = "agent-groups-updated"

function emitChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AGENT_GROUPS_EVENT))
  }
}

/* -------------------------------- local ---------------------------------- */

function readLocal(): AgentGroup[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocal(groups: AgentGroup[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
  emitChange()
}

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `grp_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`
}

/* --------------------------------- api ----------------------------------- */

/** Current signed-in user's email, read from the same store the auth hook uses. */
function currentUserEmail(): string {
  if (typeof window === "undefined") return ""
  try {
    const raw = localStorage.getItem("aws_reports_user")
    return raw ? JSON.parse(raw).email || "" : ""
  } catch {
    return ""
  }
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || "GET").toUpperCase()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  }
  // Identity is only needed for mutations (the backend authorizes edits/deletes).
  if (method !== "GET") headers["x-user-email"] = currentUserEmail()

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Agent Groups API error (${res.status})`)
  }
  return res.json()
}

/* ------------------------------- service --------------------------------- */

export const agentGroupsService = {
  /** True when groups are stored centrally (shared across all users). */
  isShared: USE_API,

  async list(): Promise<AgentGroup[]> {
    if (USE_API) {
      const items = await apiRequest<AgentGroup[]>("", { method: "GET" })
      return items.sort((a, b) => a.name.localeCompare(b.name))
    }
    return readLocal().sort((a, b) => a.name.localeCompare(b.name))
  },

  async create(name: string, agents: string[], agentNames: string[]): Promise<AgentGroup> {
    if (USE_API) {
      const group = await apiRequest<AgentGroup>("", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), agents, agentNames }),
      })
      emitChange()
      return group
    }
    const groups = readLocal()
    const group: AgentGroup = { id: genId(), name: name.trim(), agents, agentNames }
    groups.push(group)
    writeLocal(groups)
    return group
  },

  async update(
    id: string,
    patch: { name?: string; agents?: string[]; agentNames?: string[] }
  ): Promise<void> {
    if (USE_API) {
      await apiRequest(`/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(patch),
      })
      emitChange()
      return
    }
    const groups = readLocal().map((g) =>
      g.id === id ? { ...g, ...patch, name: (patch.name ?? g.name).trim() } : g
    )
    writeLocal(groups)
  },

  async remove(ids: string[]): Promise<void> {
    if (USE_API) {
      await Promise.all(
        ids.map((id) => apiRequest(`/${encodeURIComponent(id)}`, { method: "DELETE" }))
      )
      emitChange()
      return
    }
    const toDelete = new Set(ids)
    writeLocal(readLocal().filter((g) => !toDelete.has(g.id)))
  },
}
