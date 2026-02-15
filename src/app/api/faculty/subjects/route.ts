import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const firebaseUid = request.headers.get('x-firebase-uid')
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { firebaseUid } })

    if (!user || user.role !== 'FACULTY') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const subjects = await prisma.subject.findMany({
      where: { facultyId: user.id },
      include: {
        batch: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json(subjects)
  } catch (error: any) {
    console.error('Faculty subjects error:', error)
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 })
  }
}
