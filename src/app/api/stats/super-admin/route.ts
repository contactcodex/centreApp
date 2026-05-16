import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

// GET /api/stats/super-admin — super admin dashboard stats
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req)
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date()

    const [totalCentres, activeCentres, allCentres, recentCentres] = await Promise.all([
      db.centre.count(),
      db.centre.count({ where: { isActive: true } }),
      db.centre.findMany({
        include: {
          _count: {
            select: { students: true, teachers: true, groups: true },
          },
          admin: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.centre.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { students: true, teachers: true, groups: true },
          },
          admin: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ])

    const trialCentres = allCentres.filter(
      (c) => c.trialEndsAt && c.trialEndsAt > now
    ).length

    const expiredCentres = allCentres.filter(
      (c) => c.trialEndsAt && c.trialEndsAt <= now
    ).length

    const totalStudents = await db.student.count()
    const totalTeachers = await db.teacher.count()

    return NextResponse.json({
      totalCentres,
      activeCentres,
      trialCentres,
      expiredCentres,
      totalStudents,
      totalTeachers,
      recentCentres,
    })
  } catch (error) {
    console.error('GET /api/stats/super-admin error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
