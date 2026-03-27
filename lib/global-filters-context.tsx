"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { subDays } from "date-fns"

interface GlobalFiltersContextValue {
  // Input state (shown in controls)
  startDate: Date | undefined
  endDate: Date | undefined
  searchTerm: string
  selectedQueues: string[]
  isStartOpen: boolean
  isEndOpen: boolean
  queueFilterOpen: boolean

  // Applied state (what pages use for API calls)
  appliedStartDate: Date | undefined
  appliedEndDate: Date | undefined
  appliedSearchTerm: string
  appliedQueues: string[]
  applyVersion: number

  // Queue names populated by pages after fetch
  availableQueues: string[]

  // Setters
  setStartDate: (d: Date | undefined) => void
  setEndDate: (d: Date | undefined) => void
  setSearchTerm: (s: string) => void
  setSelectedQueues: (q: string[]) => void
  setIsStartOpen: (v: boolean) => void
  setIsEndOpen: (v: boolean) => void
  setQueueFilterOpen: (v: boolean) => void
  setAvailableQueues: (q: string[]) => void

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
  const [isStartOpen, setIsStartOpen] = useState(false)
  const [isEndOpen, setIsEndOpen] = useState(false)
  const [queueFilterOpen, setQueueFilterOpen] = useState(false)
  const [availableQueues, setAvailableQueues] = useState<string[]>([])

  const [appliedStartDate, setAppliedStartDate] = useState<Date | undefined>(defaultStart)
  const [appliedEndDate, setAppliedEndDate] = useState<Date | undefined>(defaultEnd)
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("")
  const [appliedQueues, setAppliedQueues] = useState<string[]>([])
  const [applyVersion, setApplyVersion] = useState(0)

  const handleApply = useCallback(() => {
    setAppliedStartDate(startDate)
    setAppliedEndDate(endDate)
    setAppliedSearchTerm(searchTerm)
    setAppliedQueues(selectedQueues)
    setApplyVersion((v) => v + 1)
  }, [startDate, endDate, searchTerm, selectedQueues])

  const handleReset = useCallback(() => {
    const s = subDays(new Date(), 30)
    const e = new Date()
    setStartDate(s)
    setEndDate(e)
    setSearchTerm("")
    setSelectedQueues([])
    setAppliedStartDate(s)
    setAppliedEndDate(e)
    setAppliedSearchTerm("")
    setAppliedQueues([])
    setApplyVersion((v) => v + 1)
  }, [])

  return (
    <GlobalFiltersContext.Provider
      value={{
        startDate, endDate, searchTerm, selectedQueues,
        isStartOpen, isEndOpen, queueFilterOpen,
        appliedStartDate, appliedEndDate, appliedSearchTerm, appliedQueues, applyVersion,
        availableQueues,
        setStartDate, setEndDate, setSearchTerm, setSelectedQueues,
        setIsStartOpen, setIsEndOpen, setQueueFilterOpen, setAvailableQueues,
        handleApply, handleReset,
      }}
    >
      {children}
    </GlobalFiltersContext.Provider>
  )
}

export function useGlobalFilters() {
  const ctx = useContext(GlobalFiltersContext)
  if (!ctx) throw new Error("useGlobalFilters must be used within GlobalFiltersProvider")
  return ctx
}
