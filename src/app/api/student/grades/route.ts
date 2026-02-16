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

    const grades = await prisma.grade.findMany({
      where: { studentId: user.id },
      include: {
        subject: {
          select: {
            name: true,
            code: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(grades)
  } catch (error: any) {
    console.error('Student grades error:', error)
    return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 })
  }
}
