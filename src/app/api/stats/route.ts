import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

// GET /api/stats — dashboard stats for current centre
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.centreId) {
      return NextResponse.json({ error: 'No centre assigned' }, { status: 403 })
    }

    const centreId = session.user.centreId

    const [
      totalStudents,
      totalTeachers,
      totalGroups,
      payments,
      recentPayments,
    ] = await Promise.all([
      db.student.count({ where: { centreId } }),
      db.teacher.count({ where: { centreId } }),
      db.group.count({ where: { centreId } }),
      db.payment.findMany({ where: { centreId } }),
      db.payment.findMany({
        where: { centreId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true },
          },
          group: {
            select: { id: true, name: true },
          },
        },
      }),
    ])

    const totalPayments = payments.length
    const paidPayments = payments.filter((p) => p.isPaid)
    const unpaidPayments = payments.filter((p) => !p.isPaid)
    const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0)
    const unpaidRevenue = unpaidPayments.reduce((sum, p) => sum + p.amount, 0)

    // Monthly revenue for last 6 months
    const now = new Date()
    const monthlyRevenue = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = date.toLocaleString('default', { month: 'short' })
      const year = date.getFullYear()
      const monthStr = date.toLocaleString('default', { month: '2-digit' })

      const monthPayments = paidPayments.filter(
        (p) => p.month === monthStr && p.year === year
      )
      const revenue = monthPayments.reduce((sum, p) => sum + p.amount, 0)

      monthlyRevenue.push({
        month: `${month} ${year}`,
        revenue,
        paymentCount: monthPayments.length,
      })
    }

    return NextResponse.json({
      totalStudents,
      totalTeachers,
      totalGroups,
      totalPayments,
      paidPayments: paidPayments.length,
      unpaidPayments: unpaidPayments.length,
      totalRevenue,
      unpaidRevenue,
      recentPayments,
      monthlyRevenue,
    })
  } catch (error) {
    console.error('GET /api/stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
