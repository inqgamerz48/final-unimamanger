import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const firebaseUid = request.headers.get('x-firebase-uid')
    if (!firebaseUid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { firebaseUid } })
    if (!user || (user.role !== 'PRINCIPAL' && user.role !== 'HOD')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    
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
