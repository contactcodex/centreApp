import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

// GET /api/groups — list groups filtered by centreId
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
          { name: { contains: search } },
          { level: { contains: search } },
        ],
      }),
    }

    const groups = await db.group.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: {
          select: { students: true, payments: true },
        },
      },
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error('GET /api/groups error:', error)
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
  }
}

// POST /api/groups — create group
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
    const { name, level, schedule, teacherId } = body

    if (!name) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    }

    // Verify teacher belongs to the same centre if provided
    if (teacherId) {
      const teacher = await db.teacher.findUnique({ where: { id: teacherId } })
      if (!teacher || teacher.centreId !== session.user.centreId) {
        return NextResponse.json({ error: 'Invalid teacher' }, { status: 400 })
      }
    }

    const group = await db.group.create({
      data: {
        name,
        level: level || null,
        schedule: schedule || null,
        teacherId: teacherId || null,
        centreId: session.user.centreId,
      },
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error('POST /api/groups error:', error)
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  }
}
