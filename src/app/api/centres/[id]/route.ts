import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

// GET /api/centres/[id] — single centre with stats
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(req)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Super admin can view any centre; centre admin can only view their own
    if (session.user.role !== 'SUPER_ADMIN' && session.user.centreId !== (await params).id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const centre = await db.centre.findUnique({
      where: { id },
      include: {
        admin: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { students: true, teachers: true, groups: true, payments: true },
        },
      },
    })

    if (!centre) {
      return NextResponse.json({ error: 'Centre not found' }, { status: 404 })
    }

    return NextResponse.json(centre)
  } catch (error) {
    console.error('GET /api/centres/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch centre' }, { status: 500 })
  }
}

// PATCH /api/centres/[id] — update centre
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(req)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: paramId } = await params
    // Super admin can update any centre; centre admin can only update their own
    if (session.user.role !== 'SUPER_ADMIN' && session.user.centreId !== paramId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    // Centre admin cannot change isActive or trialEndsAt
    const { name, email, phone, address, city, isActive, trialEndsAt } = body

    const updateData: Record<string, unknown> = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (phone !== undefined) updateData.phone = phone || null
    if (address !== undefined) updateData.address = address || null
    if (city !== undefined) updateData.city = city || null
    
    // Only super admin can change these
    if (session.user.role === 'SUPER_ADMIN') {
      if (isActive !== undefined) updateData.isActive = isActive
      if (trialEndsAt !== undefined) updateData.trialEndsAt = trialEndsAt ? new Date(trialEndsAt) : null
    }

    const centre = await db.centre.update({
      where: { id: paramId },
      data: updateData,
      include: {
        admin: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json(centre)
  } catch (error: unknown) {
    console.error('PATCH /api/centres/[id] error:', error)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Centre not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to update centre' }, { status: 500 })
  }
}

// DELETE /api/centres/[id] — delete centre
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(req)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Find the admin user linked to this centre
    const adminUser = await db.user.findFirst({ where: { centreId: id } })

    // Delete the centre (cascade will handle related data)
    await db.centre.delete({ where: { id } })

    // Also delete the admin user
    if (adminUser) {
      await db.user.delete({ where: { id: adminUser.id } })
    }

    return NextResponse.json({ message: 'Centre deleted successfully' })
  } catch (error: unknown) {
    console.error('DELETE /api/centres/[id] error:', error)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Centre not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to delete centre' }, { status: 500 })
  }
}
