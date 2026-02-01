import { readDB, writeDB } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const db = await readDB()
    // Return users without passwords
    const usersWithoutPasswords = db.users.map(({ password, ...user }: any) => user)
    return NextResponse.json(usersWithoutPasswords)
  } catch (error) {
    console.error("[v0] Get users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const db = await readDB()
    const body = await req.json()
    const { email, password, role } = body

    console.log("[v0] Creating user:", email, "with role:", role)

    // Check if user already exists
    if (db.users.some((u: any) => u.email === email)) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      role,
      isEnabled: true,
    }

    db.users.push(newUser)
    await writeDB(db)

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("[v0] Create user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
