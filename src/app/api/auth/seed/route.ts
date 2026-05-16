import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

const SUPER_ADMIN_EMAIL = 'codexadmin@gmail.com'
const SUPER_ADMIN_PASSWORD = 'Codex@123'

export async function POST(req: NextRequest) {
  try {
    const existing = await db.user.findUnique({
      where: { email: SUPER_ADMIN_EMAIL },
    })

    if (existing) {
      return NextResponse.json({ message: 'Super admin already exists', id: existing.id })
    }

    const hashedPassword = await hashPassword(SUPER_ADMIN_PASSWORD)

    const user = await db.user.create({
      data: {
        email: SUPER_ADMIN_EMAIL,
        password: hashedPassword,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
      },
    })

    return NextResponse.json({ message: 'Super admin created', id: user.id }, { status: 201 })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Failed to seed super admin' }, { status: 500 })
  }
}
