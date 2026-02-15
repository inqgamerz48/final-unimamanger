import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify FACULTY role and get user data
    const authResult = await verifyRole(request, ['FACULTY'])
    
    if (!authResult) {
      return NextResponse.json({ error: 'Forbidden - Faculty access required' }, { status: 403 })
    }

    const { prismaUser: user } = authResult

    // Fetch faculty's subjects
    const subjects = await prisma.subject.findMany({
      where: { facultyId: user.id },
      include: {
        batch: {
          include: {
            enrollments: true
          }
        }
      }
    })
    
    const subjectIds = subjects.map(s => s.id)

    // Calculate total unique students across all subjects
    const uniqueStudentIds = new Set<string>()
    subjects.forEach(subject => {
      subject.batch.enrollments.forEach(enrollment => {
        uniqueStudentIds.add(enrollment.studentId)
      })
    })

    const [pendingAssignments, pendingGrading] = await Promise.all([
      prisma.assignment.count({
        where: { 
          subjectId: { in: subjectIds },
          dueDate: { gte: new Date() }
        }
      }),
      prisma.submission.count({
        where: { 
          assignment: { subjectId: { in: subjectIds } },
          marks: null
        }
      }),
    ])

    return NextResponse.json({
      totalSubjects: subjects.length,
      totalStudents: uniqueStudentIds.size,
      pendingAssignments,
      pendingGrading,
    })
  } catch (error) {
    console.error('Faculty stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
