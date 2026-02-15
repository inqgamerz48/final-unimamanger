import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const firebaseUid = request.headers.get('x-firebase-uid')
    if (!firebaseUid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { firebaseUid } })
    if (!user || (user.role !== 'PRINCIPAL' && user.role !== 'HOD')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    
    // SECURITY: HODs can only resolve complaints from their department
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
      data: { status: 'RESOLVED', resolvedById: user.id, resolvedAt: new Date() }
    })
    return NextResponse.json(complaint)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to resolve complaint' }, { status: 500 })
  }
}
