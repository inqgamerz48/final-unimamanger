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

    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const complaints = await prisma.complaint.findMany({
      where: { studentId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(complaints)
  } catch (error: any) {
    console.error('Student complaints error:', error)
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const firebaseUid = request.headers.get('x-firebase-uid')
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { firebaseUid } })

    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description } = body

    const complaint = await prisma.complaint.create({
      data: {
        title,
        description,
        studentId: user.id,
      }
    })

    return NextResponse.json(complaint)
  } catch (error: any) {
    console.error('Create complaint error:', error)
    return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 })
  }
}
