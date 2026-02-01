import { readDB, writeDB } from "@/lib/db"
import { NextResponse } from "next/server"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = await readDB()
    const updates = await req.json()

    const routeIndex = db.routes.findIndex((r: any) => r.id === id)
    if (routeIndex === -1) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 })
    }

    // Merge updates
    db.routes[routeIndex] = { ...db.routes[routeIndex], ...updates }
    await writeDB(db)

    return NextResponse.json(db.routes[routeIndex])
  } catch (error) {
    console.error("[v0] Update route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = await readDB()

    const routeIndex = db.routes.findIndex((r: any) => r.id === id)
    if (routeIndex === -1) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 })
    }

    db.routes.splice(routeIndex, 1)
    await writeDB(db)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
