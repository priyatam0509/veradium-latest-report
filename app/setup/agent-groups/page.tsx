"use client"

import { useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Trash2, Pencil, Search, Users, X, Loader2 } from "lucide-react"
import { useGlobalFilters } from "@/lib/global-filters-context"
import { useAuth } from "@/hooks/use-auth"
import { agentGroupsService, AGENT_GROUPS_EVENT, type AgentGroup } from "@/lib/agent-groups-service"

export default function AgentGroupsPage() {
  const { availableAgents } = useGlobalFilters()
  const { user } = useAuth()

  // Edit/Delete permission (mirrors the backend rule):
  //  - SUPERUSER: any group
  //  - MANAGER-REGION: groups in their region
  //  - everyone else: only groups they created
  const canManage = (group: AgentGroup): boolean => {
    if (user?.tier === "SUPERUSER") return true
    if (user?.tier === "MANAGER-REGION" && group.region && user?.region && group.region === user.region) return true
    return !!group.createdBy && !!user?.email && group.createdBy === user.email
  }

  const [groups, setGroups] = useState<AgentGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [marked, setMarked] = useState<Set<string>>(new Set())

  // Add/Edit dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AgentGroup | null>(null)
  const [name, setName] = useState("")
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [agentSearch, setAgentSearch] = useState("")
  const [saving, setSaving] = useState(false)

  const loadGroups = async () => {
    setLoading(true)
    const list = await agentGroupsService.list()
    setGroups(list)
    setLoading(false)
  }

  useEffect(() => {
    loadGroups()
    const onChange = () => loadGroups()
    window.addEventListener(AGENT_GROUPS_EVENT, onChange)
    return () => window.removeEventListener(AGENT_GROUPS_EVENT, onChange)
  }, [])

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return groups
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.agentNames.some((n) => n.toLowerCase().includes(q))
    )
  }, [groups, search])

  const openAdd = () => {
    setEditing(null)
    setName("")
    setSelectedAgents([])
    setAgentSearch("")
    setDialogOpen(true)
  }

  const openEdit = (group: AgentGroup) => {
    setEditing(group)
    setName(group.name)
    setSelectedAgents(group.agents)
    setAgentSearch("")
    setDialogOpen(true)
  }

  const toggleAgent = (value: string) => {
    setSelectedAgents((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  const handleSave = async () => {
    if (!name.trim() || selectedAgents.length === 0) return
    setSaving(true)
    const agentNames = selectedAgents.map(
      (v) => availableAgents.find((a) => a.value === v)?.display || v
    )
    if (editing) {
      await agentGroupsService.update(editing.id, { name, agents: selectedAgents, agentNames })
    } else {
      await agentGroupsService.create(name, selectedAgents, agentNames)
    }
    setSaving(false)
    setDialogOpen(false)
  }

  const handleDelete = async (id: string) => {
    await agentGroupsService.remove([id])
    setMarked((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleDeleteMarked = async () => {
    if (marked.size === 0) return
    await agentGroupsService.remove([...marked])
    setMarked(new Set())
  }

  const toggleMark = (id: string) => {
    setMarked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allMarked = filteredGroups.length > 0 && filteredGroups.every((g) => marked.has(g.id))
  const toggleMarkAll = () => {
    setMarked(allMarked ? new Set() : new Set(filteredGroups.map((g) => g.id)))
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agent Groups</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage agent groups to use as a shortcut in the report filters.
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle>Groups</CardTitle>
                  <CardDescription>Add a group, then include agents in it.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={openAdd}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteMarked}
                    disabled={marked.size === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Marked{marked.size > 0 ? ` (${marked.size})` : ""}
                  </Button>
                </div>
              </div>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search groups or agents…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredGroups.length > 0 ? (
                <div className="scrollable-table">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox checked={allMarked} onCheckedChange={toggleMarkAll} />
                        </TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                        <TableHead>Group</TableHead>
                        <TableHead>Agents</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGroups.map((group) => {
                        const manageable = canManage(group)
                        return (
                        <TableRow key={group.id}>
                          <TableCell>
                            <Checkbox
                              checked={marked.has(group.id)}
                              onCheckedChange={() => toggleMark(group.id)}
                              disabled={!manageable}
                            />
                          </TableCell>
                          <TableCell>
                            {manageable ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openEdit(group)}
                                  title="Edit"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => handleDelete(group.id)}
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground" title="You can only edit groups you created or that are in your region">View only</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{group.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {group.agentNames.length > 0 ? (
                                group.agentNames.map((n, i) => (
                                  <Badge key={i} variant="secondary" className="font-normal">
                                    {n}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {search ? `No groups match "${search}"` : "No groups yet. Click Add to create one."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add / Edit dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Group" : "Add Group"}</DialogTitle>
              <DialogDescription>
                Give the group a name and choose which agents belong to it.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Group name</label>
                <Input
                  placeholder="e.g. Test Group"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Agents{selectedAgents.length > 0 ? ` (${selectedAgents.length})` : ""}
                </label>

                {selectedAgents.length > 0 && (
                  <div className="flex flex-wrap gap-1 rounded-md border p-2">
                    {selectedAgents.map((v) => {
                      const label = availableAgents.find((a) => a.value === v)?.display || v
                      return (
                        <Badge key={v} variant="secondary" className="font-normal gap-1">
                          {label}
                          <button
                            type="button"
                            onClick={() => toggleAgent(v)}
                            className="hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                )}

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search agents…"
                    value={agentSearch}
                    onChange={(e) => setAgentSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto rounded-md border divide-y">
                  {availableAgents.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-3 py-2">Loading agents…</p>
                  ) : (
                    availableAgents
                      .filter((a) => a.display.toLowerCase().includes(agentSearch.toLowerCase()))
                      .map((a) => (
                        <div
                          key={a.value}
                          className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent cursor-pointer"
                          onClick={() => toggleAgent(a.value)}
                        >
                          <Checkbox
                            checked={selectedAgents.includes(a.value)}
                            onCheckedChange={() => toggleAgent(a.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-sm truncate" title={a.display}>
                            {a.display}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !name.trim() || selectedAgents.length === 0}
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Users className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </AuthGuard>
  )
}
