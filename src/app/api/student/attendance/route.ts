import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['STUDENT'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prismaUser: user } = authResult

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
