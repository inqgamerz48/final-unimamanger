import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyRole(request, ['STUDENT'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prismaUser: user } = authResult
    const assignmentId = params.id

    // Check if assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Check if already submitted
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: user.id,
        }
      }
    })

    if (existingSubmission) {
      return NextResponse.json({ error: 'Already submitted' }, { status: 400 })
    }

    // Check if overdue
    if (new Date(assignment.dueDate) < new Date()) {
      return NextResponse.json({ error: 'Assignment is overdue' }, { status: 400 })
    }

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        assignmentId,
        studentId: user.id,
      }
    })

    return NextResponse.json(submission)
  } catch (error: any) {
    console.error('Submit assignment error:', error)
    return NextResponse.json({ error: 'Failed to submit assignment' }, { status: 500 })
  }
}
