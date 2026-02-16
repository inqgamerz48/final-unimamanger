import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['PRINCIPAL', 'HOD'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prismaUser: user } = authResult
    const whereClause = user.role === 'HOD' ? { student: { departmentId: user.departmentId } } : {}
    
    const complaints = await prisma.complaint.findMany({
      where: whereClause,
      include: { student: { select: { fullName: true, studentId: true } } },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(complaints)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 })
  }
}
