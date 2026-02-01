import { readDB, writeDB } from "@/lib/db"
import { NextResponse } from "next/server"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = await readDB()
    const updates = await req.json()

    const userIndex = db.users.findIndex((u: any) => u.id === id)
    if (userIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Merge updates
    db.users[userIndex] = { ...db.users[userIndex], ...updates }
    await writeDB(db)

    // Return user without password
    const { password: _, ...userWithoutPassword } = db.users[userIndex]
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("[v0] Update user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = await readDB()

    const userIndex = db.users.findIndex((u: any) => u.id === id)
    if (userIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent deleting default admin
    if (db.users[userIndex].email === "piyush@veradium.com" && db.users[userIndex].role === "ADMIN") {
      return NextResponse.json({ error: "Cannot delete default admin" }, { status: 403 })
    }

    db.users.splice(userIndex, 1)
    await writeDB(db)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
