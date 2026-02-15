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

    const [enrollments, pendingAssignments, pendingFees, notices, complaints] = await Promise.all([
      prisma.enrollment.count({ where: { studentId: user.id } }),
      prisma.assignment.count({
        where: {
          subject: { batch: { enrollments: { some: { studentId: user.id } } } },
          dueDate: { gte: new Date() },
          submissions: { none: { studentId: user.id } }
        }
      }),
      prisma.fee.findFirst({
        where: { studentId: user.id, status: 'PENDING' },
        select: { amount: true }
      }),
      prisma.notice.count({
        where: {
          OR: [
            { departmentId: user.departmentId },
            { departmentId: null }
          ]
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.complaint.count({
        where: { 
          studentId: user.id,
          status: { in: ['PENDING', 'IN_PROGRESS'] }
        }
      }),
    ])

    return NextResponse.json({
      enrolledSubjects: enrollments,
      attendance: 85, // Placeholder - would need actual calculation
      pendingAssignments,
      feeDue: pendingFees?.amount || 0,
      notices,
      complaints,
    })
  } catch (error: any) {
    console.error('Student stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
