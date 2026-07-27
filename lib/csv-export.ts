const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}/

function formatCsvValue(v: unknown): string {
  // Treat null, undefined, and placeholder dashes as empty
  const str = v === null || v === undefined || v === "—" || v === "-" ? "" : String(v)

  if (str === "") return '""'

  // Wrap dates and phone numbers in ="..." to prevent Excel from auto-converting them
  if (DATE_PATTERN.test(str) || str.startsWith("+")) {
    return `="${str.replace(/"/g, '""')}"`
  }

  return `"${str.replace(/"/g, '""')}"`
}

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) return
  const headers = Object.keys(data[0]).join(",")
  const rows = data.map((row) => Object.values(row).map(formatCsvValue).join(","))
  // UTF-8 BOM ensures Excel opens the file with correct encoding
  const csv = "\uFEFF" + [headers, ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}
