"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { subDays } from "date-fns"
import { athenaAPI } from "@/lib/athena-api"

interface GlobalFiltersContextValue {
  // Input state (shown in controls)
  startDate: Date | undefined
  endDate: Date | undefined
  searchTerm: string
  selectedQueues: string[]   // item_value UIDs
  selectedAgents: string[]   // item_value UIDs
  selectedDids: string[]     // item_value phone numbers
  selectedRegions: string[]
  isStartOpen: boolean
  isEndOpen: boolean
  queueFilterOpen: boolean
  agentFilterOpen: boolean
  didFilterOpen: boolean
  regionFilterOpen: boolean

  // Applied state (what pages use for API calls) — these are item_value (UIDs/phones)
  appliedStartDate: Date | undefined
  appliedEndDate: Date | undefined
  appliedSearchTerm: string
  appliedQueues: string[]
  appliedAgents: string[]
  appliedDids: string[]
  appliedRegions: string[]
  applyVersion: number

  // Available options — {display: label shown in UI, value: sent to API}
  availableQueues: { display: string; value: string }[]
  availableAgents: { display: string; value: string }[]
  availableDids: { display: string; value: string }[]

  // Setters
  setStartDate: (d: Date | undefined) => void
  setEndDate: (d: Date | undefined) => void
  setSearchTerm: (s: string) => void
  setSelectedQueues: (q: string[]) => void
  setSelectedAgents: (a: string[]) => void
  setSelectedDids: (d: string[]) => void
  setSelectedRegions: (r: string[]) => void
  setIsStartOpen: (v: boolean) => void
  setIsEndOpen: (v: boolean) => void
  setQueueFilterOpen: (v: boolean) => void
  setAgentFilterOpen: (v: boolean) => void
  setDidFilterOpen: (v: boolean) => void
  setRegionFilterOpen: (v: boolean) => void
  setAvailableQueues: (q: { display: string; value: string }[]) => void

  // Actions
  handleApply: () => void
  handleReset: () => void
}

const GlobalFiltersContext = createContext<GlobalFiltersContextValue | null>(null)

export function GlobalFiltersProvider({ children }: { children: React.ReactNode }) {
  const defaultStart = subDays(new Date(), 30)
  const defaultEnd = new Date()

  const [startDate, setStartDate] = useState<Date | undefined>(defaultStart)
  const [endDate, setEndDate] = useState<Date | undefined>(defaultEnd)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedQueues, setSelectedQueues] = useState<string[]>([])
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [selectedDids, setSelectedDids] = useState<string[]>([])
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [isStartOpen, setIsStartOpen] = useState(false)
  const [isEndOpen, setIsEndOpen] = useState(false)
  const [queueFilterOpen, setQueueFilterOpen] = useState(false)
  const [agentFilterOpen, setAgentFilterOpen] = useState(false)
  const [didFilterOpen, setDidFilterOpen] = useState(false)
  const [regionFilterOpen, setRegionFilterOpen] = useState(false)
  const [availableQueues, setAvailableQueues] = useState<{ display: string; value: string }[]>([])
  const [availableAgents, setAvailableAgents] = useState<{ display: string; value: string }[]>([])
  const [availableDids, setAvailableDids] = useState<{ display: string; value: string }[]>([])

  // Load lookup lists from API on mount — store both display (label) and value (UID sent to queries)
  useEffect(() => {
    // Load queue list
    athenaAPI.getLookupQueueList().then((result) => {
      if (result?.status === "SUCCEEDED" && Array.isArray(result.data) && result.data.length > 0) {
        const items = result.data
          .map((row: any) => ({
            display: String(row.item_display || row.queue_name || row.queue || row.name || Object.values(row)[0] || ""),
            value: String(row.item_value || row.queue_id || row.item_display || row.queue_name || Object.values(row)[0] || ""),
          }))
          .filter((i: { display: string; value: string }) => i.display && i.value)
          .sort((a: { display: string; value: string }, b: { display: string; value: string }) => a.display.localeCompare(b.display))
        if (items.length > 0) setAvailableQueues(items)
      }
    }).catch(() => {})

    // Load agent list
    athenaAPI.getLookupAgentList().then((result) => {
      if (result?.status === "SUCCEEDED" && Array.isArray(result.data) && result.data.length > 0) {
        const items = result.data
          .map((row: any) => ({
            display: String(row.item_display || row.agent_name || row.agent || row.name || Object.values(row)[0] || ""),
            value: String(row.item_value || row.agent_id || row.user_id || row.item_display || row.agent_name || Object.values(row)[0] || ""),
          }))
          .filter((i: { display: string; value: string }) => i.display && i.value)
          .sort((a: { display: string; value: string }, b: { display: string; value: string }) => a.display.localeCompare(b.display))
        if (items.length > 0) setAvailableAgents(items)
      }
    }).catch(() => {})

    // Load phone/DID list
    athenaAPI.getLookupPhoneList().then((result) => {
      if (result?.status === "SUCCEEDED" && Array.isArray(result.data) && result.data.length > 0) {
        const items = result.data
          .map((row: any) => ({
            display: String(row.item_display || row.did || row.phone || Object.values(row)[0] || ""),
            value: String(row.item_value || row.did || row.phone || row.item_display || Object.values(row)[0] || ""),
          }))
          .filter((i: { display: string; value: string }) => i.display && i.value)
          .sort((a: { display: string; value: string }, b: { display: string; value: string }) => a.display.localeCompare(b.display))
        if (items.length > 0) setAvailableDids(items)
      }
    }).catch(() => {})
  }, [])

  const [appliedStartDate, setAppliedStartDate] = useState<Date | undefined>(defaultStart)
  const [appliedEndDate, setAppliedEndDate] = useState<Date | undefined>(defaultEnd)
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("")
  const [appliedQueues, setAppliedQueues] = useState<string[]>([])
  const [appliedAgents, setAppliedAgents] = useState<string[]>([])
  const [appliedDids, setAppliedDids] = useState<string[]>([])
  const [appliedRegions, setAppliedRegions] = useState<string[]>([])
  const [applyVersion, setApplyVersion] = useState(0)

  const handleApply = useCallback(() => {
    setAppliedStartDate(startDate)
    setAppliedEndDate(endDate)
    setAppliedSearchTerm(searchTerm)
    setAppliedQueues(selectedQueues)
    setAppliedAgents(selectedAgents)
    setAppliedDids(selectedDids)
    setAppliedRegions(selectedRegions)
    setApplyVersion((v) => v + 1)
  }, [startDate, endDate, searchTerm, selectedQueues, selectedAgents, selectedDids, selectedRegions])

  const handleReset = useCallback(() => {
    const s = subDays(new Date(), 30)
    const e = new Date()
    setStartDate(s)
    setEndDate(e)
    setSearchTerm("")
    setSelectedQueues([])
    setSelectedAgents([])
    setSelectedDids([])
    setSelectedRegions([])
    setAppliedStartDate(s)
    setAppliedEndDate(e)
    setAppliedSearchTerm("")
    setAppliedQueues([])
    setAppliedAgents([])
    setAppliedDids([])
    setAppliedRegions([])
    setApplyVersion((v) => v + 1)
  }, [])

  return (
    <GlobalFiltersContext.Provider
      value={{
        startDate, endDate, searchTerm,
        selectedQueues, selectedAgents, selectedDids, selectedRegions,
        isStartOpen, isEndOpen,
        queueFilterOpen, agentFilterOpen, didFilterOpen, regionFilterOpen,
        appliedStartDate, appliedEndDate, appliedSearchTerm,
        appliedQueues, appliedAgents, appliedDids, appliedRegions, applyVersion,
        availableQueues, availableAgents, availableDids,
        setStartDate, setEndDate, setSearchTerm,
        setSelectedQueues, setSelectedAgents, setSelectedDids, setSelectedRegions,
        setIsStartOpen, setIsEndOpen,
        setQueueFilterOpen, setAgentFilterOpen, setDidFilterOpen, setRegionFilterOpen,
        setAvailableQueues,
        handleApply, handleReset,
      }}
    >
      {children}
    </GlobalFiltersContext.Provider>
  )
}

export function useGlobalFilters() {
  const ctx = useContext(GlobalFiltersContext)
  if (!ctx) {
    // Return safe no-op defaults during SSR prerender (before provider mounts)
    const noop = () => {}
    const defaultDate = subDays(new Date(), 30)
    return {
      startDate: defaultDate,
      endDate: new Date(),
      searchTerm: "",
      selectedQueues: [] as string[],
      selectedAgents: [] as string[],
      selectedDids: [] as string[],
      selectedRegions: [] as string[],
      isStartOpen: false,
      isEndOpen: false,
      queueFilterOpen: false,
      agentFilterOpen: false,
      didFilterOpen: false,
      regionFilterOpen: false,
      appliedStartDate: defaultDate,
      appliedEndDate: new Date(),
      appliedSearchTerm: "",
      appliedQueues: [] as string[],
      appliedAgents: [] as string[],
      appliedDids: [] as string[],
      appliedRegions: [] as string[],
      applyVersion: 0,
      availableQueues: [] as { display: string; value: string }[],
      availableAgents: [] as { display: string; value: string }[],
      availableDids: [] as { display: string; value: string }[],
      setStartDate: noop,
      setEndDate: noop,
      setSearchTerm: noop,
      setSelectedQueues: noop,
      setSelectedAgents: noop,
      setSelectedDids: noop,
      setSelectedRegions: noop,
      setIsStartOpen: noop,
      setIsEndOpen: noop,
      setQueueFilterOpen: noop,
      setAgentFilterOpen: noop,
      setDidFilterOpen: noop,
      setRegionFilterOpen: noop,
      setAvailableQueues: noop,
      handleApply: noop,
      handleReset: noop,
    } as GlobalFiltersContextValue
  }
  return ctx
}
