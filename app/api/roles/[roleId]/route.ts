import { readDB, writeDB } from "@/lib/db"
import { NextResponse } from "next/server"

export async function DELETE(req: Request, { params }: { params: Promise<{ roleId: string }> }) {
  try {
    const { roleId } = await params
    const db = await readDB()

    // Prevent deleting default roles
    if (["ADMIN", "SUPERVISOR", "ANALYST"].includes(roleId)) {
      return NextResponse.json({ error: "Cannot delete default role" }, { status: 403 })
    }

    const roleIndex = db.roles.findIndex((r: any) => r.roleId === roleId)
    if (roleIndex === -1) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    db.roles.splice(roleIndex, 1)
    await writeDB(db)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete role error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
