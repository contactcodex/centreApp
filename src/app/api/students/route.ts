import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

// GET /api/students — list students filtered by centreId
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where = {
      centreId: session.user.centreId,
      ...(search && {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { parentName: { contains: search } },
          { phone: { contains: search } },
        ],
      }),
    }

    const [students, total] = await Promise.all([
      db.student.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { payments: true, groups: true },
          },
        },
      }),
      db.student.count({ where }),
    ])

    return NextResponse.json({
      students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/students error:', error)
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
  }
}

// POST /api/students — create student
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
    const { firstName, lastName, phone, parentName, parentPhone, level } = body

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 })
    }

    const student = await db.student.create({
      data: {
        firstName,
        lastName,
        phone: phone || null,
        parentName: parentName || null,
        parentPhone: parentPhone || null,
        level: level || null,
        centreId: session.user.centreId,
      },
    })

    return NextResponse.json(student, { status: 201 })
  } catch (error) {
    console.error('POST /api/students error:', error)
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 })
  }
}
