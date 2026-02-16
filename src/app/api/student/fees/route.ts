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

    const fees = await prisma.fee.findMany({
      where: { studentId: user.id },
      orderBy: { dueDate: 'desc' },
    })

    return NextResponse.json(fees)
  } catch (error: any) {
    console.error('Student fees error:', error)
    return NextResponse.json({ error: 'Failed to fetch fees' }, { status: 500 })
  }
}
