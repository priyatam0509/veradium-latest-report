import { readDB, writeDB } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const db = await readDB()
    return NextResponse.json(db.roles)
  } catch (error) {
    console.error("[v0] Get roles error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const db = await readDB()
    const { roleId, description, color } = await req.json()

    // Check if role already exists
    if (db.roles.some((r: any) => r.roleId === roleId)) {
      return NextResponse.json({ error: "Role already exists" }, { status: 400 })
    }

    const newRole = {
      roleId,
      description,
      color: color || "bg-gray-500/10 text-gray-500 border-gray-500/20",
    }

    db.roles.push(newRole)
    await writeDB(db)

    return NextResponse.json(newRole)
  } catch (error) {
    console.error("[v0] Create role error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
