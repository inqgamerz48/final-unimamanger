import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// PUT - Update department
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyRole(request, ['PRINCIPAL'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, code, hodId } = body

    // Check if department exists
    const existingDept = await prisma.department.findUnique({
      where: { id: params.id }
    })

    if (!existingDept) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }

    // Build update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (code !== undefined) updateData.code = code.toUpperCase()
    if (code !== undefined) updateData.code = code.toUpperCase()
    if (hodId !== undefined) updateData.hodId = hodId || null

    // Handle Exam Cell Coordinator
    if (body.examCellCoordinatorId !== undefined) {
      updateData.examCellCoordinatorId = body.examCellCoordinatorId || null
    }

    const updatedDept = await prisma.department.update({
      where: { id: params.id },
      data: updateData,
      include: {
        hod: { select: { fullName: true, id: true } },
        examCellCoordinator: { select: { fullName: true, id: true } },
        _count: { select: { users: true, batches: true } }
      }
    })

    return NextResponse.json(updatedDept)
  } catch (error: any) {
    console.error('Update department error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Department code already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update department' },
      { status: 500 }
    )
  }
}

// DELETE - Delete department
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyRole(request, ['PRINCIPAL'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for dependencies before deletion
    const deptWithCounts = await prisma.department.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { users: true, batches: true, subjects: true }
        }
      }
    })

    if (!deptWithCounts) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }

    if (deptWithCounts._count.users > 0) {
      return NextResponse.json(
        { error: `Cannot delete: Department has ${deptWithCounts._count.users} users assigned` },
        { status: 400 }
      )
    }

    if (deptWithCounts._count.batches > 0) {
      return NextResponse.json(
        { error: `Cannot delete: Department has ${deptWithCounts._count.batches} batches` },
        { status: 400 }
      )
    }

    if (deptWithCounts._count.subjects > 0) {
      return NextResponse.json(
        { error: `Cannot delete: Department has ${deptWithCounts._count.subjects} subjects` },
        { status: 400 }
      )
    }

    await prisma.department.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete department error:', error)
    return NextResponse.json({ error: 'Failed to delete department' }, { status: 500 })
  }
}
