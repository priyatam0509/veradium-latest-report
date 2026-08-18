import { NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/api-auth"

/**
 * Server-side proxy for the reporting query API.
 *
 * The browser calls this same-origin route (no credentials in the bundle); the
 * server adds the x-api-key and forwards to the real query API. The key is read
 * from a SERVER-ONLY env var (DEV_KEY / QUERY_API_KEY — no NEXT_PUBLIC_ prefix),
 * so it is never shipped to the browser or visible in the console/sources.
 */

const QUERY_API =
  process.env.QUERY_API_URL || "https://16rzda4gyd.execute-api.us-east-1.amazonaws.com/prod"
// Prefer a server-only key; fall back to the legacy public var during transition.
const API_KEY = process.env.DEV_KEY || process.env.QUERY_API_KEY || process.env.NEXT_PUBLIC_DEV_KEY || ""

export async function POST(req: Request) {
  try {
    if (!(await isAuthenticated(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await req.text()
    const upstream = await fetch(`${QUERY_API}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
      body,
    })
    const data = await upstream.text()
    return new NextResponse(data, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("[api/query] proxy error:", error)
    return NextResponse.json({ error: "Query proxy failed" }, { status: 502 })
  }
}
