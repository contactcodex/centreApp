import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

// PATCH /api/payments/[id] — update payment
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

    const existing = await db.payment.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (session.user.role !== 'SUPER_ADMIN' && existing.centreId !== session.user.centreId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { amount, month, year, isPaid, note, groupId } = body

    // If marking as paid and wasn't before, set paidAt
    let paidAt = existing.paidAt
    if (isPaid === true && !existing.isPaid) {
      paidAt = new Date()
    } else if (isPaid === false) {
      paidAt = null
    }

    const payment = await db.payment.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(month && { month }),
        ...(year && { year: parseInt(year) }),
        ...(isPaid !== undefined && { isPaid }),
        ...(paidAt !== undefined && { paidAt }),
        ...(note !== undefined && { note: note || null }),
        ...(groupId !== undefined && { groupId: groupId || null }),
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true },
        },
        group: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(payment)
  } catch (error) {
    console.error('PATCH /api/payments/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
  }
}

// DELETE /api/payments/[id] — delete payment
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

    const existing = await db.payment.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (session.user.role !== 'SUPER_ADMIN' && existing.centreId !== session.user.centreId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.payment.delete({ where: { id } })

    return NextResponse.json({ message: 'Payment deleted successfully' })
  } catch (error: unknown) {
    console.error('DELETE /api/payments/[id] error:', error)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 })
  }
}
