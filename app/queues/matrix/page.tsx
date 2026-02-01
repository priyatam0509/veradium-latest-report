import { Suspense } from "react"
import QueueMatrixContent from "./queue-matrix-content"

export default function QueueMatrixPage() {
  return (
    <Suspense fallback={null}>
      <QueueMatrixContent />
    </Suspense>
  )
}
