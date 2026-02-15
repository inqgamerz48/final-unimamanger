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

    const attendance = await prisma.attendance.findMany({
      where: { studentId: user.id },
      include: {
        subject: {
          select: {
            name: true,
            code: true,
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 100,
    })

    return NextResponse.json(attendance)
  } catch (error: any) {
    console.error('Student attendance error:', error)
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
  }
}
