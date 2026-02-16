import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['FACULTY', 'HOD', 'PRINCIPAL'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prismaUser } = authResult
    const departmentId = prismaUser.departmentId

    const notices = await prisma.notice.findMany({
      where: {
        OR: [
          { departmentId: null },
          { departmentId: departmentId }
        ]
      },
      include: {
        postedBy: {
          select: { fullName: true }
        },
        department: {
          select: { name: true, code: true }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(notices)
  } catch (error) {
    console.error('Faculty notices error:', error)
    return NextResponse.json({ error: 'Failed to fetch notices' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['FACULTY', 'HOD', 'PRINCIPAL'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prismaUser } = authResult
    const body = await request.json()

    const { title, content, priority, departmentId, batchId } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        priority: priority || 'NORMAL',
        departmentId: departmentId || prismaUser.departmentId,
        batchId,
        postedById: prismaUser.id
      },
      include: {
        postedBy: {
          select: { fullName: true }
        }
      }
    })

    return NextResponse.json(notice, { status: 201 })
  } catch (error) {
    console.error('Create notice error:', error)
    return NextResponse.json({ error: 'Failed to create notice' }, { status: 500 })
  }
}
