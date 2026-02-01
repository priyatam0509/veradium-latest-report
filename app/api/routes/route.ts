import { readDB, writeDB } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const db = await readDB()
    return NextResponse.json(db.routes)
  } catch (error) {
    console.error("[v0] Get routes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const db = await readDB()
    const { route, label, allowedRoles } = await req.json()

    // Check if route already exists
    if (db.routes.some((r: any) => r.route === route)) {
      return NextResponse.json({ error: "Route already exists" }, { status: 400 })
    }

    const newRoute = {
      id: Date.now().toString(),
      route,
      label,
      allowedRoles,
      isEnabled: true,
    }

    db.routes.push(newRoute)
    await writeDB(db)

    return NextResponse.json(newRoute)
  } catch (error) {
    console.error("[v0] Create route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
