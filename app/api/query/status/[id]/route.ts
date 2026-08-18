import { NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/api-auth"

/**
 * Server-side proxy for the query status endpoint. Same purpose as /api/query:
 * inject the x-api-key server-side so it never reaches the browser.
 */

const QUERY_API =
  process.env.QUERY_API_URL || "https://16rzda4gyd.execute-api.us-east-1.amazonaws.com/prod"
const API_KEY = process.env.DEV_KEY || process.env.QUERY_API_KEY || process.env.NEXT_PUBLIC_DEV_KEY || ""

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAuthenticated(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    const upstream = await fetch(`${QUERY_API}/query/status/${encodeURIComponent(id)}`, {
      headers: { "x-api-key": API_KEY },
    })
    const data = await upstream.text()
    return new NextResponse(data, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("[api/query/status] proxy error:", error)
    return NextResponse.json({ error: "Query status proxy failed" }, { status: 502 })
  }
}
