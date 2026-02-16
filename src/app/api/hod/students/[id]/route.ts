import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'
import { auth } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

// Helper to verify HOD owns this student
async function verifyHODAndStudent(request: NextRequest, studentId: string) {
  const authResult = await verifyRole(request, ['HOD'])
  
  if (!authResult) {
    return { error: 'Forbidden', status: 403 }
  }

  const { prismaUser: user } = authResult
  const departmentId = user.departmentId

  if (!departmentId) {
    return { error: 'HOD not assigned to department', status: 400 }
  }

  const student = await prisma.user.findFirst({
    where: {
      id: studentId,
      role: 'STUDENT',
      departmentId: departmentId,
    },
  })

  if (!student) {
    return { error: 'Student not found in your department', status: 404 }
  }

  return { user, student, departmentId }
}

// GET - Get single student
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await verifyHODAndStudent(request, params.id)
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const studentWithDetails = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        department: { select: { name: true, code: true } },
        enrollments: {
          include: {
            batch: { select: { name: true, year: true, semester: true } },
          },
        },
      },
    })

    return NextResponse.json(studentWithDetails)
  } catch (error) {
    console.error('Get student error:', error)
    return NextResponse.json({ error: 'Failed to fetch student' }, { status: 500 })
  }
}

// PUT - Update student
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await verifyHODAndStudent(request, params.id)
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const body = await request.json()
    const { fullName, phone, studentId, isActive, batchId } = body

    // Check if studentId already exists (if being updated)
    if (studentId) {
      const existingStudent = await prisma.user.findFirst({
        where: {
          studentId,
          id: { not: params.id },
        },
      })
      if (existingStudent) {
        return NextResponse.json(
          { error: 'Student ID already exists' },
          { status: 409 }
        )
      }
    }

    const updatedStudent = await prisma.user.update({
      where: { id: params.id },
      data: {
        fullName,
        phone,
        studentId,
        isActive,
      },
      include: {
        department: { select: { name: true, code: true } },
        enrollments: {
          include: {
            batch: { select: { name: true, year: true, semester: true } },
          },
        },
      },
    })

    // Update enrollment if batchId provided
    if (batchId) {
      const existingEnrollment = await prisma.enrollment.findFirst({
        where: { studentId: params.id },
      })

      if (existingEnrollment) {
        await prisma.enrollment.update({
          where: { id: existingEnrollment.id },
          data: { batchId },
        })
      } else {
        await prisma.enrollment.create({
          data: {
            studentId: params.id,
            batchId,
            academicYear: new Date().getFullYear().toString(),
          },
        })
      }
    }

    return NextResponse.json(updatedStudent)
  } catch (error) {
    console.error('Update student error:', error)
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 })
  }
}

// DELETE - Delete student
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await verifyHODAndStudent(request, params.id)
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const { student } = result

    // Delete from Firebase Auth
    try {
      await auth.deleteUser(student.firebaseUid)
    } catch (error) {
      console.error('Firebase delete error:', error)
      // Continue with DB deletion even if Firebase fails
    }

    // Delete from database (cascades to enrollments)
    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Student deleted successfully' })
  } catch (error) {
    console.error('Delete student error:', error)
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 })
  }
}
