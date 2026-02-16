import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// Helper to verify HOD owns this notice
async function verifyHODAndNotice(request: NextRequest, noticeId: string) {
  const authResult = await verifyRole(request, ['HOD'])
  
  if (!authResult) {
    return { error: 'Forbidden', status: 403 }
  }

  const { prismaUser: user } = authResult
  const departmentId = user.departmentId

  if (!departmentId) {
    return { error: 'HOD not assigned to department', status: 400 }
  }

  const notice = await prisma.notice.findFirst({
    where: {
      id: noticeId,
      departmentId: departmentId,
    },
  })

  if (!notice) {
    return { error: 'Notice not found in your department', status: 404 }
  }

  return { user, notice, departmentId }
}

// GET - Get single notice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await verifyHODAndNotice(request, params.id)
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const noticeWithDetails = await prisma.notice.findUnique({
      where: { id: params.id },
      include: {
        department: { select: { name: true, code: true } },
        batch: { select: { name: true, year: true, semester: true } },
        postedBy: { select: { fullName: true, role: true } },
      },
    })

    return NextResponse.json(noticeWithDetails)
  } catch (error) {
    console.error('Get notice error:', error)
    return NextResponse.json({ error: 'Failed to fetch notice' }, { status: 500 })
  }
}

// PUT - Update notice
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await verifyHODAndNotice(request, params.id)
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const body = await request.json()
    const { title, content, priority, isPinned } = body

    const updatedNotice = await prisma.notice.update({
      where: { id: params.id },
      data: {
        title,
        content,
        priority,
        isPinned,
      },
      include: {
        department: { select: { name: true, code: true } },
        batch: { select: { name: true, year: true, semester: true } },
        postedBy: { select: { fullName: true, role: true } },
      },
    })

    return NextResponse.json(updatedNotice)
  } catch (error) {
    console.error('Update notice error:', error)
    return NextResponse.json({ error: 'Failed to update notice' }, { status: 500 })
  }
}

// DELETE - Delete notice
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await verifyHODAndNotice(request, params.id)
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    await prisma.notice.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Notice deleted successfully' })
  } catch (error) {
    console.error('Delete notice error:', error)
    return NextResponse.json({ error: 'Failed to delete notice' }, { status: 500 })
  }
}
