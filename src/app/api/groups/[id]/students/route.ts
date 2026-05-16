import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

// POST /api/groups/[id]/students — add student to group
export async function POST(
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
    const { studentId } = body

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    // Verify group belongs to the centre
    const group = await db.group.findUnique({ where: { id } })
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    if (session.user.role !== 'SUPER_ADMIN' && group.centreId !== session.user.centreId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify student belongs to the same centre
    const student = await db.student.findUnique({ where: { id: studentId } })
    if (!student || (session.user.role !== 'SUPER_ADMIN' && student.centreId !== session.user.centreId)) {
      return NextResponse.json({ error: 'Invalid student' }, { status: 400 })
    }

    // Check if already in group
    const existing = await db.groupStudent.findUnique({
      where: { groupId_studentId: { groupId: id, studentId } },
    })

    if (existing) {
      return NextResponse.json({ error: 'Student is already in this group' }, { status: 400 })
    }

    const groupStudent = await db.groupStudent.create({
      data: {
        groupId: id,
        studentId,
      },
      include: {
        student: true,
      },
    })

    return NextResponse.json(groupStudent, { status: 201 })
  } catch (error) {
    console.error('POST /api/groups/[id]/students error:', error)
    return NextResponse.json({ error: 'Failed to add student to group' }, { status: 500 })
  }
}

// DELETE /api/groups/[id]/students — remove student from group
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
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    // Verify group belongs to the centre
    const group = await db.group.findUnique({ where: { id } })
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    if (session.user.role !== 'SUPER_ADMIN' && group.centreId !== session.user.centreId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.groupStudent.delete({
      where: { groupId_studentId: { groupId: id, studentId } },
    })

    return NextResponse.json({ message: 'Student removed from group' })
  } catch (error: unknown) {
    console.error('DELETE /api/groups/[id]/students error:', error)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Student not in this group' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to remove student from group' }, { status: 500 })
  }
}
