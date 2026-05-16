import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

// GET /api/teachers/[id]
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

    const teacher = await db.teacher.findUnique({
      where: { id },
      include: {
        groups: {
          include: {
            _count: {
              select: { students: true },
            },
          },
        },
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    if (session.user.role !== 'SUPER_ADMIN' && teacher.centreId !== session.user.centreId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(teacher)
  } catch (error) {
    console.error('GET /api/teachers/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch teacher' }, { status: 500 })
  }
}

// PATCH /api/teachers/[id]
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

    const existing = await db.teacher.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    if (session.user.role !== 'SUPER_ADMIN' && existing.centreId !== session.user.centreId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { firstName, lastName, phone, subject } = body

    const teacher = await db.teacher.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(subject !== undefined && { subject: subject || null }),
      },
    })

    return NextResponse.json(teacher)
  } catch (error) {
    console.error('PATCH /api/teachers/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update teacher' }, { status: 500 })
  }
}

// DELETE /api/teachers/[id]
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

    const existing = await db.teacher.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    if (session.user.role !== 'SUPER_ADMIN' && existing.centreId !== session.user.centreId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.teacher.delete({ where: { id } })

    return NextResponse.json({ message: 'Teacher deleted successfully' })
  } catch (error: unknown) {
    console.error('DELETE /api/teachers/[id] error:', error)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to delete teacher' }, { status: 500 })
  }
}
