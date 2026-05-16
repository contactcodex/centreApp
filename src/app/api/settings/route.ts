import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

// GET /api/settings — get all settings for a centre
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.centreId) {
      return NextResponse.json({ error: 'No centre assigned' }, { status: 403 })
    }

    const settings = await db.setting.findMany({
      where: { centreId: session.user.centreId },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('GET /api/settings error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PUT /api/settings — upsert settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getAuthSession(req)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.centreId) {
      return NextResponse.json({ error: 'No centre assigned' }, { status: 403 })
    }

    const body = await req.json()
    const { settings } = body as { settings: { key: string; value: string }[] }

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json({ error: 'Settings array is required' }, { status: 400 })
    }

    const centreId = session.user.centreId

    // Upsert each setting
    const results = await Promise.all(
      settings.map((setting) =>
        db.setting.upsert({
          where: {
            centreId_key: {
              centreId,
              key: setting.key,
            },
          },
          update: {
            value: setting.value,
          },
          create: {
            centreId,
            key: setting.key,
            value: setting.value,
          },
        })
      )
    )

    return NextResponse.json(results)
  } catch (error) {
    console.error('PUT /api/settings error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
