import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createGradeSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

// Helper to verify faculty
async function verifyFaculty(request: NextRequest) {
  const firebaseUid = request.headers.get('x-firebase-uid')
  
  if (!firebaseUid) {
    return { error: 'Unauthorized', status: 401 }
  }

  const user = await prisma.user.findUnique({ where: { firebaseUid } })

  if (!user || (user.role !== 'FACULTY' && user.role !== 'HOD')) {
    return { error: 'Forbidden', status: 403 }
  }

  return { user }
}

// GET - List all students with grades for faculty's subjects
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyFaculty(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult

    // Get all subjects taught by this faculty
    const subjects = await prisma.subject.findMany({
      where: { facultyId: user.id },
      include: {
        batch: {
          select: { name: true, id: true }
        },
        department: {
          select: { name: true }
        }
      }
    })

    // Get all grades for these subjects
    const grades = await prisma.grade.findMany({
      where: {
        subjectId: { in: subjects.map(s => s.id) }
      },
      include: {
        student: {
          select: { id: true, fullName: true, studentId: true }
        },
        subject: {
          select: { id: true, name: true, code: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ subjects, grades })
  } catch (error: any) {
    console.error('Faculty grades error:', error)
    return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 })
  }
}

// POST - Create or update grades for students
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyFaculty(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const body = await request.json()
    
    // Validate input with Zod
    const validationResult = createGradeSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }
    
    const { studentId, subjectId, examType, marks, totalMarks } = validationResult.data
    
    // Validate marks don't exceed total
    if (marks > totalMarks) {
      return NextResponse.json(
        { error: 'Marks cannot exceed total marks' },
        { status: 400 }
      )
    }

    // Verify faculty teaches this subject
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        facultyId: user.id
      }
    })

    if (!subject) {
      return NextResponse.json(
        { error: 'You are not authorized to grade this subject' },
        { status: 403 }
      )
    }

    // Verify student is enrolled in this subject's batch
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        batchId: subject.batchId
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Student is not enrolled in this subject' },
        { status: 400 }
      )
    }

    // Check if grade already exists
    const existingGrade = await prisma.grade.findUnique({
      where: {
        studentId_subjectId_examType: {
          studentId,
          subjectId,
          examType
        }
      }
    })

    let grade
    if (existingGrade) {
      // Update existing grade
      grade = await prisma.grade.update({
        where: { id: existingGrade.id },
        data: {
          marks,
          totalMarks
        },
        include: {
          student: {
            select: { id: true, fullName: true, studentId: true }
          },
          subject: {
            select: { id: true, name: true, code: true }
          }
        }
      })
    } else {
      // Create new grade
      grade = await prisma.grade.create({
        data: {
          studentId,
          subjectId,
          examType,
          marks,
          totalMarks
        },
        include: {
          student: {
            select: { id: true, fullName: true, studentId: true }
          },
          subject: {
            select: { id: true, name: true, code: true }
          }
        }
      })
    }

    return NextResponse.json(grade, { status: existingGrade ? 200 : 201 })
  } catch (error: any) {
    console.error('Create grade error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create grade' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a grade
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyFaculty(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const { searchParams } = new URL(request.url)
    const gradeId = searchParams.get('id')

    if (!gradeId) {
      return NextResponse.json({ error: 'Grade ID required' }, { status: 400 })
    }

    // Verify faculty owns this grade's subject
    const grade = await prisma.grade.findFirst({
      where: {
        id: gradeId,
        subject: { facultyId: user.id }
      }
    })

    if (!grade) {
      return NextResponse.json({ error: 'Grade not found' }, { status: 404 })
    }

    await prisma.grade.delete({
      where: { id: gradeId }
    })

    return NextResponse.json({ message: 'Grade deleted successfully' })
  } catch (error: any) {
    console.error('Delete grade error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete grade' },
      { status: 500 }
    )
  }
}
