import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'
import { hashPassword } from '@/lib/auth'

// GET /api/centres — list all centres (super admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req)
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const centres = await db.centre.findMany({
      include: {
        admin: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { students: true, teachers: true, groups: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(centres)
  } catch (error) {
    console.error('GET /api/centres error:', error)
    return NextResponse.json({ error: 'Failed to fetch centres' }, { status: 500 })
  }
}

// POST /api/centres — create centre with admin
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession(req)
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { name, email, phone, address, city, adminName, adminEmail, adminPassword, trialHours } = body

    // Validate required fields
    if (!name || !email || !adminName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, adminName, adminEmail, adminPassword' },
        { status: 400 }
      )
    }

    // Check if centre email already exists
    const existingCentre = await db.centre.findUnique({ where: { email } })
    if (existingCentre) {
      return NextResponse.json({ error: 'Centre email already exists' }, { status: 400 })
    }

    // Check if admin email already exists
    const existingAdmin = await db.user.findUnique({ where: { email: adminEmail } })
    if (existingAdmin) {
      return NextResponse.json({ error: 'Admin email already exists' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(adminPassword)

    const hours = trialHours ?? 24
    const trialEndsAt = new Date()
    trialEndsAt.setHours(trialEndsAt.getHours() + hours)

    // Create centre first, then user linked to it
    const centre = await db.centre.create({
      data: {
        name,
        email,
        phone: phone || null,
        address: address || null,
        city: city || null,
        trialEndsAt,
      },
    })

    const user = await db.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        role: 'CENTRE_ADMIN',
        centreId: centre.id,
      },
    })

    return NextResponse.json({
      ...centre,
      admin: { id: user.id, name: user.name, email: user.email },
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/centres error:', error)
    return NextResponse.json({ error: 'Failed to create centre' }, { status: 500 })
  }
}
