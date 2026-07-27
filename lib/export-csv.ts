/**
 * Exports tabular data to a downloaded CSV file.
 *
 * @param filename  Name of the downloaded file (".csv" appended if missing).
 * @param headers   Column header labels.
 * @param rows      Row data — each row is an array of cell values aligned to `headers`.
 */
export function exportToCSV(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>
) {
  const escape = (value: string | number | null | undefined) => {
    const s = value === null || value === undefined ? "" : String(value)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }

  const csv = [headers, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\n")

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = Object.assign(document.createElement("a"), {
    href: url,
    download: filename.endsWith(".csv") ? filename : `${filename}.csv`,
  })
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
