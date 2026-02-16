import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['FACULTY'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prismaUser: user } = authResult

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
