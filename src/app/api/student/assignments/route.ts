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

    // Get student's enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: user.id },
      include: {
        batch: {
          include: {
            subjects: true
          }
        }
      }
    })

    const subjectIds = enrollments.flatMap(e => e.batch.subjects.map(s => s.id))

    const assignments = await prisma.assignment.findMany({
      where: { subjectId: { in: subjectIds } },
      include: {
        subject: {
          select: {
            name: true,
            code: true,
          }
        },
        submissions: {
          where: { studentId: user.id }
        }
      },
      orderBy: { dueDate: 'asc' },
    })

    const result = assignments.map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      dueDate: a.dueDate,
      subject: a.subject,
      submission: a.submissions[0] ? {
        id: a.submissions[0].id,
        submittedAt: a.submissions[0].submittedAt,
        marks: a.submissions[0].marks,
        feedback: a.submissions[0].feedback,
      } : null,
    }))

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Student assignments error:', error)
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }
}
