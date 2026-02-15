import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify STUDENT role and get user data
    const authResult = await verifyRole(request, ['STUDENT'])
    
    if (!authResult) {
      return NextResponse.json({ error: 'Forbidden - Student access required' }, { status: 403 })
    }

    const { prismaUser: user } = authResult

    // Fetch student-scoped statistics
    const [enrollments, pendingAssignments, pendingFees, notices, complaints, attendanceStats] = await Promise.all([
      prisma.enrollment.count({ where: { studentId: user.id } }),
      prisma.assignment.count({
        where: {
          subject: { batch: { enrollments: { some: { studentId: user.id } } } },
          dueDate: { gte: new Date() },
          submissions: { none: { studentId: user.id } }
        }
      }),
      prisma.fee.aggregate({
        where: { 
          studentId: user.id, 
          status: { in: ['PENDING', 'OVERDUE'] }
        },
        _sum: { amount: true }
      }),
      prisma.notice.count({
        where: {
          OR: [
            { departmentId: user.departmentId },
            { departmentId: null }
          ]
        }
      }),
      prisma.complaint.count({
        where: { 
          studentId: user.id,
          status: { in: ['PENDING', 'IN_PROGRESS'] }
        }
      }),
      // Calculate actual attendance percentage
      prisma.attendance.groupBy({
        by: ['status'],
        where: { studentId: user.id },
        _count: { status: true }
      })
    ])

    // Calculate attendance percentage
    const totalAttendance = attendanceStats.reduce((sum, stat) => sum + stat._count.status, 0)
    const presentCount = attendanceStats.find(s => s.status === 'PRESENT')?._count.status || 0
    const attendancePercentage = totalAttendance > 0 
      ? Math.round((presentCount / totalAttendance) * 100) 
      : 0

    return NextResponse.json({
      enrolledSubjects: enrollments,
      attendance: attendancePercentage,
      pendingAssignments,
      feeDue: pendingFees._sum.amount || 0,
      notices,
      complaints,
    })
  } catch (error) {
    console.error('Student stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
