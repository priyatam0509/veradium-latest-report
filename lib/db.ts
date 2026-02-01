import { Redis } from "@upstash/redis"
import { DEFAULT_ROLES, DEFAULT_ROUTES, DEFAULT_ADMIN } from "./auth-types"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export async function readDB() {
  try {
    const data = await redis.get("app_db")
    if (data) return data as any

    // This ensures the role dropdown in the Admin side is populated on first run
    const seedData = {
      users: [DEFAULT_ADMIN],
      roles: DEFAULT_ROLES,
      routes: DEFAULT_ROUTES,
    }

    // Optionally save the seed data immediately so it persists
    await redis.set("app_db", seedData)
    return seedData
  } catch (error) {
    console.error("[v0] Error reading from Redis:", error)
    return { users: [], roles: [], routes: [] }
  }
}

export async function writeDB(data: any) {
  try {
    console.log("[v0] Saving to Redis:", JSON.stringify(data.users.map((u: any) => u.email)))
    await redis.set("app_db", data)
    console.log("[v0] Redis save successful")
  } catch (error) {
    console.error("[v0] Error writing to Redis:", error)
    throw error
  }
}
