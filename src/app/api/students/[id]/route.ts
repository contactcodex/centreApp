import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

// GET /api/students/[id] — single student
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

    const student = await db.student.findUnique({
      where: { id },
      include: {
        groups: {
          include: {
            group: {
              include: {
                teacher: { select: { id: true, firstName: true, lastName: true } },
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Centre admin can only view their own centre's students
    if (session.user.role !== 'SUPER_ADMIN' && student.centreId !== session.user.centreId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(student)
  } catch (error) {
    console.error('GET /api/students/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch student' }, { status: 500 })
  }
}

// PATCH /api/students/[id] — update student
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

    // Verify student belongs to the centre
    const existing = await db.student.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (session.user.role !== 'SUPER_ADMIN' && existing.centreId !== session.user.centreId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { firstName, lastName, phone, parentName, parentPhone, level } = body

    const student = await db.student.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(parentName !== undefined && { parentName: parentName || null }),
        ...(parentPhone !== undefined && { parentPhone: parentPhone || null }),
        ...(level !== undefined && { level: level || null }),
      },
    })

    return NextResponse.json(student)
  } catch (error) {
    console.error('PATCH /api/students/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 })
  }
}

// DELETE /api/students/[id] — delete student
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

    // Verify student belongs to the centre
    const existing = await db.student.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (session.user.role !== 'SUPER_ADMIN' && existing.centreId !== session.user.centreId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.student.delete({ where: { id } })

    return NextResponse.json({ message: 'Student deleted successfully' })
  } catch (error: unknown) {
    console.error('DELETE /api/students/[id] error:', error)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 })
  }
}
