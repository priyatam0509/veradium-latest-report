"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { athenaAPI } from "@/lib/athena-api"
import { DateHelper } from "@/lib/date-helper"

export default function TestAPIPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testAPI = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log("🧪 Starting API test...")
      const dateRange = DateHelper.getLastNDays(30)
      console.log("📅 Date range:", dateRange)

      const data = await athenaAPI.getDistributionByQueue(dateRange.start, dateRange.end)
      
      console.log("✅ API Response:", data)
      setResult(data)
    } catch (err: any) {
      console.error("❌ API Error:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>API Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testAPI} disabled={loading}>
            {loading ? "Testing..." : "Test distribution_distbyqueue API"}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800">
              <strong>Error:</strong> {error}
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <strong>✅ API Call Successful!</strong>
                <div className="mt-2">
                  <div>Status: {result.status}</div>
                  <div>Row Count: {result.rowCount}</div>
                  <div>Data Length: {result.data?.length}</div>
                  <div>Execution Time: {result.executionTime}ms</div>
                </div>
              </div>

              <div>
                <strong>Columns:</strong>
                <pre className="p-2 bg-gray-100 rounded overflow-x-auto text-xs">
                  {JSON.stringify(result.columns, null, 2)}
                </pre>
              </div>

              <div>
                <strong>First Record:</strong>
                <pre className="p-2 bg-gray-100 rounded overflow-x-auto text-xs">
                  {JSON.stringify(result.data?.[0], null, 2)}
                </pre>
              </div>

              <div>
                <strong>Full Response:</strong>
                <pre className="p-2 bg-gray-100 rounded overflow-x-auto text-xs max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
