"use client"

/**
 * Agent Groups service.
 *
 * Named collections of agents used to speed up the Agent filter — a reporting
 * manager can pick a group instead of selecting agents one by one.
 *
 * Storage is currently browser localStorage (MVP). Every method is async and
 * the shape is deliberately narrow so this can be swapped for a backend API
 * (e.g. an /agent-groups endpoint like the RBAC service) later WITHOUT touching
 * the UI — only the bodies below change.
 */

export interface AgentGroup {
  id: string
  name: string
  /** Agent UIDs (item_value) sent to the reporting queries. */
  agents: string[]
  /** Display names, cached so the table/label don't need a lookup. */
  agentNames: string[]
}

const STORAGE_KEY = "aws_reports_agent_groups"
/** Fired on the window whenever groups change, so open dropdowns can refresh. */
export const AGENT_GROUPS_EVENT = "agent-groups-updated"

function read(): AgentGroup[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function write(groups: AgentGroup[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
  window.dispatchEvent(new Event(AGENT_GROUPS_EVENT))
}

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `grp_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`
}

export const agentGroupsService = {
  async list(): Promise<AgentGroup[]> {
    return read().sort((a, b) => a.name.localeCompare(b.name))
  },

  async create(name: string, agents: string[], agentNames: string[]): Promise<AgentGroup> {
    const groups = read()
    const group: AgentGroup = { id: genId(), name: name.trim(), agents, agentNames }
    groups.push(group)
    write(groups)
    return group
  },

  async update(
    id: string,
    patch: { name?: string; agents?: string[]; agentNames?: string[] }
  ): Promise<void> {
    const groups = read().map((g) =>
      g.id === id
        ? {
            ...g,
            ...patch,
            name: (patch.name ?? g.name).trim(),
          }
        : g
    )
    write(groups)
  },

  async remove(ids: string[]): Promise<void> {
    const toDelete = new Set(ids)
    write(read().filter((g) => !toDelete.has(g.id)))
  },
}
