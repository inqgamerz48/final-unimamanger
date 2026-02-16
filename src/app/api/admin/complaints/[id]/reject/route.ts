import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyRole(request, ['PRINCIPAL', 'HOD'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prismaUser: user } = authResult
    
    // SECURITY: HODs can only reject complaints from their department
    if (user.role === 'HOD') {
      const complaint = await prisma.complaint.findUnique({
        where: { id: params.id },
        include: { student: { select: { departmentId: true } } }
      })
      if (complaint?.student?.departmentId !== user.departmentId) {
        return NextResponse.json({ error: 'Forbidden - Not your department' }, { status: 403 })
      }
    }
    
    const complaint = await prisma.complaint.update({
      where: { id: params.id },
      data: { status: 'REJECTED', resolvedById: user.id, resolvedAt: new Date() }
    })
    return NextResponse.json(complaint)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reject complaint' }, { status: 500 })
  }
}
