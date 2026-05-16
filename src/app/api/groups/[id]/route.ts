import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

// GET /api/groups/[id] — single group with students
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(req)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const group = await db.group.findUnique({
      where: { id },
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true, subject: true },
        },
        students: {
          include: {
            student: true,
          },
          orderBy: { joinedAt: 'desc' },
        },
        _count: {
          select: { payments: true },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    if (session.user.role !== 'SUPER_ADMIN' && group.centreId !== session.user.centreId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error('GET /api/groups/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 })
  }
}

// PATCH /api/groups/[id] — update group
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(req)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    const existing = await db.group.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    if (session.user.role !== 'SUPER_ADMIN' && existing.centreId !== session.user.centreId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, level, schedule, teacherId } = body

    // Verify teacher belongs to the same centre if provided
    if (teacherId) {
      const teacher = await db.teacher.findUnique({ where: { id: teacherId } })
      if (!teacher || (session.user.role !== 'SUPER_ADMIN' && teacher.centreId !== session.user.centreId)) {
        return NextResponse.json({ error: 'Invalid teacher' }, { status: 400 })
      }
    }

    const group = await db.group.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(level !== undefined && { level: level || null }),
        ...(schedule !== undefined && { schedule: schedule || null }),
        ...(teacherId !== undefined && { teacherId: teacherId || null }),
      },
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    })

    return NextResponse.json(group)
  } catch (error) {
    console.error('PATCH /api/groups/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 })
  }
}

// DELETE /api/groups/[id] — delete group
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(req)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await db.group.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    if (session.user.role !== 'SUPER_ADMIN' && existing.centreId !== session.user.centreId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.group.delete({ where: { id } })

    return NextResponse.json({ message: 'Group deleted successfully' })
  } catch (error: unknown) {
    console.error('DELETE /api/groups/[id] error:', error)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 })
  }
}
