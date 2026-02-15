import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const firebaseUid = request.headers.get('x-firebase-uid')
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { firebaseUid } })

    if (!user || (user.role !== 'PRINCIPAL' && user.role !== 'HOD')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const whereClause = user.role === 'HOD' 
      ? { departmentId: user.departmentId }
      : {}

    const notices = await prisma.notice.findMany({
      where: whereClause,
      include: {
        department: { select: { name: true } }
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(notices)
  } catch (error: any) {
    console.error('Admin notices GET error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch notices' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const firebaseUid = request.headers.get('x-firebase-uid')
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { firebaseUid } })

    if (!user || (user.role !== 'PRINCIPAL' && user.role !== 'HOD')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, priority, departmentId, isPinned } = body

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        priority,
        departmentId: departmentId || null,
        isPinned,
        postedById: user.id,
      }
    })

    return NextResponse.json(notice)
  } catch (error: any) {
    console.error('Create notice error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create notice' }, { status: 500 })
  }
}
