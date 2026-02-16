import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// Helper to verify HOD owns this assignment
async function verifyHODAndAssignment(request: NextRequest, assignmentId: string) {
  const authResult = await verifyRole(request, ['HOD'])
  
  if (!authResult) {
    return { error: 'Forbidden', status: 403 }
  }

  const { prismaUser: user } = authResult
  const departmentId = user.departmentId

  if (!departmentId) {
    return { error: 'HOD not assigned to department', status: 400 }
  }

  const assignment = await prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      subject: { departmentId: departmentId },
    },
  })

  if (!assignment) {
    return { error: 'Assignment not found in your department', status: 404 }
  }

  return { user, assignment, departmentId }
}

// GET - Get single assignment with submissions
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await verifyHODAndAssignment(request, params.id)
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const assignmentWithDetails = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: {
        subject: {
          include: {
            batch: { select: { name: true, year: true, semester: true } },
          },
        },
        createdBy: { select: { fullName: true, role: true } },
        submissions: {
          include: {
            student: { select: { fullName: true, studentId: true } },
          },
        },
      },
    })

    return NextResponse.json(assignmentWithDetails)
  } catch (error) {
    console.error('Get assignment error:', error)
    return NextResponse.json({ error: 'Failed to fetch assignment' }, { status: 500 })
  }
}

// PUT - Update assignment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await verifyHODAndAssignment(request, params.id)
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const body = await request.json()
    const { title, description, dueDate } = body

    const updatedAssignment = await prisma.assignment.update({
      where: { id: params.id },
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
      include: {
        subject: {
          include: {
            batch: { select: { name: true, year: true, semester: true } },
          },
        },
        createdBy: { select: { fullName: true, role: true } },
      },
    })

    return NextResponse.json(updatedAssignment)
  } catch (error) {
    console.error('Update assignment error:', error)
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 })
  }
}

// DELETE - Delete assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await verifyHODAndAssignment(request, params.id)
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    await prisma.assignment.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Assignment deleted successfully' })
  } catch (error) {
    console.error('Delete assignment error:', error)
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 })
  }
}
