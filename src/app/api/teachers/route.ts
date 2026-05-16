import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

// GET /api/teachers — list teachers filtered by centreId
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.centreId) {
      return NextResponse.json({ error: 'No centre assigned' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''

    const where = {
      centreId: session.user.centreId,
      ...(search && {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { subject: { contains: search } },
        ],
      }),
    }

    const teachers = await db.teacher.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { groups: true },
        },
      },
    })

    return NextResponse.json(teachers)
  } catch (error) {
    console.error('GET /api/teachers error:', error)
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 })
  }
}

// POST /api/teachers — create teacher
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession(req)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.centreId) {
      return NextResponse.json({ error: 'No centre assigned' }, { status: 403 })
    }

    const body = await req.json()
    const { firstName, lastName, phone, subject } = body

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 })
    }

    const teacher = await db.teacher.create({
      data: {
        firstName,
        lastName,
        phone: phone || null,
        subject: subject || null,
        centreId: session.user.centreId,
      },
    })

    return NextResponse.json(teacher, { status: 201 })
  } catch (error) {
    console.error('POST /api/teachers error:', error)
    return NextResponse.json({ error: 'Failed to create teacher' }, { status: 500 })
  }
}
