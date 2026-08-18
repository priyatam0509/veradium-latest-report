/**
 * Server-side Entra ID (Microsoft) authentication for API routes.
 *
 * The browser sends its Microsoft access token as `Authorization: Bearer <token>`.
 * We validate it by calling Microsoft Graph /me — the recommended way to verify a
 * Graph access token (Graph tokens should not be validated locally). A short
 * in-memory cache avoids a Graph round-trip on every request within a warm server
 * instance.
 *
 * Returns true only for a valid, non-expired Entra token — so unauthenticated
 * callers (e.g. a raw curl) are rejected before any upstream call is made.
 */

const GRAPH_ME = "https://graph.microsoft.com/v1.0/me"
const TTL_MS = 5 * 60 * 1000

// token -> expiry epoch ms (per warm server instance)
const validated = new Map<string, number>()

export async function isAuthenticated(req: Request): Promise<boolean> {
  const header = req.headers.get("authorization") || ""
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : ""
  if (!token) return false

  const now = Date.now()
  const cachedUntil = validated.get(token)
  if (cachedUntil && cachedUntil > now) return true

  try {
    const res = await fetch(GRAPH_ME, { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) {
      validated.set(token, now + TTL_MS)
      // opportunistic cleanup so the map doesn't grow unbounded
      if (validated.size > 500) {
        for (const [k, exp] of validated) if (exp <= now) validated.delete(k)
      }
      return true
    }
  } catch {
    // network error -> treat as unauthenticated (fail closed)
  }
  return false
}
