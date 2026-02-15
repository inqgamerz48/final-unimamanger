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

    if (!user || user.role !== 'FACULTY') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const subjects = await prisma.subject.findMany({
      where: { facultyId: user.id },
    })
    const subjectIds = subjects.map(s => s.id)

    const [totalSubjects, enrollments, pendingAssignments, pendingGrading] = await Promise.all([
      Promise.resolve(subjects.length),
      prisma.enrollment.count({
        where: { batch: { subjects: { some: { id: { in: subjectIds } } } } }
      }),
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
      totalSubjects,
      totalStudents: enrollments,
      pendingAssignments,
      pendingGrading,
    })
  } catch (error: any) {
    console.error('Faculty stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
