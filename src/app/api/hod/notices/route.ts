import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// GET - List notices for HOD's department
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['HOD'])
    
    if (!authResult) {
      return NextResponse.json({ error: 'Forbidden - HOD access required' }, { status: 403 })
    }

    const { prismaUser: user } = authResult
    const departmentId = user.departmentId

    if (!departmentId) {
      return NextResponse.json({ error: 'HOD not assigned to any department' }, { status: 400 })
    }

    const notices = await prisma.notice.findMany({
      where: {
        OR: [
          { departmentId: departmentId },
          { departmentId: null }, // Also show general notices
        ],
      },
      include: {
        department: { select: { name: true, code: true } },
        batch: { select: { name: true, year: true, semester: true } },
        postedBy: { select: { fullName: true, role: true } },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(notices)
  } catch (error) {
    console.error('HOD notices fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch notices' }, { status: 500 })
  }
}

// POST - Create new notice for HOD's department
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['HOD'])
    
    if (!authResult) {
      return NextResponse.json({ error: 'Forbidden - HOD access required' }, { status: 403 })
    }

    const { prismaUser: user } = authResult
    const departmentId = user.departmentId

    if (!departmentId) {
      return NextResponse.json({ error: 'HOD not assigned to any department' }, { status: 400 })
    }

    const body = await request.json()
    const { title, content, priority, isPinned, batchId } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    // Verify batch belongs to HOD's department (if provided)
    if (batchId) {
      const batch = await prisma.batch.findFirst({
        where: { id: batchId, departmentId },
      })
      if (!batch) {
        return NextResponse.json({ error: 'Invalid batch for your department' }, { status: 400 })
      }
    }

    const newNotice = await prisma.notice.create({
      data: {
        title,
        content,
        priority: priority || 'NORMAL',
        isPinned: isPinned || false,
        departmentId: departmentId,
        batchId: batchId || null,
        postedById: user.id,
      },
      include: {
        department: { select: { name: true, code: true } },
        batch: { select: { name: true, year: true, semester: true } },
        postedBy: { select: { fullName: true, role: true } },
      },
    })

    return NextResponse.json(newNotice, { status: 201 })
  } catch (error: any) {
    console.error('Create notice error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create notice' },
      { status: 500 }
    )
  }
}
