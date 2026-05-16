import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

// GET /api/payments — list payments filtered by centreId
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
    const month = searchParams.get('month')
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
    const groupId = searchParams.get('groupId')
    const studentId = searchParams.get('studentId')
    const isPaid = searchParams.get('isPaid')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {
      centreId: session.user.centreId,
      ...(month && { month }),
      ...(year && { year }),
      ...(groupId && { groupId }),
      ...(studentId && { studentId }),
      ...(isPaid !== null && isPaid !== undefined && isPaid !== '' && { isPaid: isPaid === 'true' }),
    }

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true },
          },
          group: {
            select: { id: true, name: true },
          },
        },
      }),
      db.payment.count({ where }),
    ])

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/payments error:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

// POST /api/payments — create payment
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
    const { amount, month, year, isPaid, note, studentId, groupId } = body

    if (!amount || !month || !year || !studentId) {
      return NextResponse.json(
        { error: 'Amount, month, year, and studentId are required' },
        { status: 400 }
      )
    }

    // Verify student belongs to the centre
    const student = await db.student.findUnique({ where: { id: studentId } })
    if (!student || student.centreId !== session.user.centreId) {
      return NextResponse.json({ error: 'Invalid student' }, { status: 400 })
    }

    const payment = await db.payment.create({
      data: {
        amount: parseFloat(amount),
        month,
        year: parseInt(year),
        isPaid: isPaid === true || isPaid === 'true',
        paidAt: isPaid === true || isPaid === 'true' ? new Date() : null,
        note: note || null,
        studentId,
        groupId: groupId || null,
        centreId: session.user.centreId,
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

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('POST /api/payments error:', error)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}
