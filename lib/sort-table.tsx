"use client"

import { useState, useMemo } from "react"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import { TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export type SortDir = "asc" | "desc" | null

export function useSortable<T extends Record<string, any>>(data: T[]) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return data
    return [...data].sort((a, b) => {
      const av = a[sortKey] ?? ""
      const bv = b[sortKey] ?? ""
      const an = parseFloat(av)
      const bn = parseFloat(bv)
      const numA = isNaN(an) ? av : an
      const numB = isNaN(bn) ? bv : bn
      if (numA < numB) return sortDir === "asc" ? -1 : 1
      if (numA > numB) return sortDir === "asc" ? 1 : -1
      return 0
    })
  }, [data, sortKey, sortDir])

  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir("asc")
    } else if (sortDir === "asc") {
      setSortDir("desc")
    } else {
      setSortKey(null)
      setSortDir(null)
    }
  }

  return { sorted, handleSort, sortKey, sortDir }
}

export function SortHead({
  col,
  label,
  sortKey,
  sortDir,
  onSort,
  className,
}: {
  col: string
  label: string
  sortKey: string | null
  sortDir: SortDir
  onSort: (k: string) => void
  className?: string
}) {
  return (
    <TableHead
      className={cn("cursor-pointer select-none whitespace-nowrap", className)}
      onClick={() => onSort(col)}
    >
      {label}
      {sortKey !== col ? (
        <ChevronsUpDown className="ml-1 h-3 w-3 opacity-40 inline-block" />
      ) : sortDir === "asc" ? (
        <ChevronUp className="ml-1 h-3 w-3 inline-block" />
      ) : (
        <ChevronDown className="ml-1 h-3 w-3 inline-block" />
      )}
    </TableHead>
  )
}
