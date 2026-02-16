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

    const notices = await prisma.notice.findMany({
      where: {
        OR: [
          { departmentId: user.departmentId },
          { departmentId: null },
        ]
      },
      include: {
        postedBy: {
          select: { fullName: true }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 50,
    })

    return NextResponse.json(notices)
  } catch (error: any) {
    console.error('Student notices error:', error)
    return NextResponse.json({ error: 'Failed to fetch notices' }, { status: 500 })
  }
}
