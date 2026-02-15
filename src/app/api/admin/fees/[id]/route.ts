import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateFeeSchema } from '@/lib/validations'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// PUT - Update fee
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyRole(request, ['PRINCIPAL'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    
    // Validate input
    const validationResult = updateFeeSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    // Check if fee exists
    const existingFee = await prisma.fee.findUnique({
      where: { id }
    })

    if (!existingFee) {
      return NextResponse.json({ error: 'Fee not found' }, { status: 404 })
    }

    // Don't allow editing paid fees (unless it's just remarks)
    if (existingFee.status === 'PAID' && (body.amount || body.dueDate)) {
      return NextResponse.json(
        { error: 'Cannot edit paid fees. Create a new fee instead.' },
        { status: 400 }
      )
    }

    // Update fee
    const updateData: any = {}
    if (body.amount !== undefined) updateData.amount = body.amount
    if (body.dueDate !== undefined) updateData.dueDate = new Date(body.dueDate)
    if (body.feeType !== undefined) updateData.feeType = body.feeType
    if (body.description !== undefined) updateData.description = body.description
    if (body.academicYear !== undefined) updateData.academicYear = body.academicYear

    const fee = await prisma.fee.update({
      where: { id },
      data: updateData,
      include: {
        student: {
          select: {
            fullName: true,
            studentId: true,
          },
        },
      },
    })

    return NextResponse.json(fee)
  } catch (error) {
    console.error('Update fee error:', error)
    return NextResponse.json(
      { error: 'Failed to update fee' },
      { status: 500 }
    )
  }
}

// DELETE - Delete fee
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyRole(request, ['PRINCIPAL'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const { id } = params

    // Check if fee exists
    const existingFee = await prisma.fee.findUnique({
      where: { id }
    })

    if (!existingFee) {
      return NextResponse.json({ error: 'Fee not found' }, { status: 404 })
    }

    // Don't allow deleting paid fees
    if (existingFee.status === 'PAID') {
      return NextResponse.json(
        { error: 'Cannot delete paid fees. Mark as waived if needed.' },
        { status: 400 }
      )
    }

    // Delete fee
    await prisma.fee.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Fee deleted successfully' })
  } catch (error) {
    console.error('Delete fee error:', error)
    return NextResponse.json(
      { error: 'Failed to delete fee' },
      { status: 500 }
    )
  }
}
