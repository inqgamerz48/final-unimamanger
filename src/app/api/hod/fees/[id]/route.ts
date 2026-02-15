import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { markFeePaidSchema } from '@/lib/validations'
import { verifyRole } from '@/lib/auth-verification'

// POST - Mark fee as paid (HOD can only mark, not edit other details)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyRole(request, ['HOD'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized - HOD access required' }, { status: 401 })
    }

    const { prismaUser } = authResult
    
    if (!prismaUser.departmentId) {
      return NextResponse.json({ error: 'HOD not assigned to any department' }, { status: 400 })
    }

    // Check if fee belongs to HOD's department student
    const fee = await prisma.fee.findFirst({
      where: {
        id: params.id,
        student: {
          departmentId: prismaUser.departmentId,
          role: 'STUDENT'
        }
      }
    })

    if (!fee) {
      return NextResponse.json({ error: 'Fee not found or access denied' }, { status: 404 })
    }
    const body = await request.json()
    
    // Validate input
    const validationResult = markFeePaidSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { status, amountPaid, paymentMode, remarks } = validationResult.data

    // Calculate amount paid
    let finalAmountPaid = amountPaid || fee.amount
    
    if (status === 'PARTIALLY_PAID') {
      if (!amountPaid || amountPaid <= 0 || amountPaid >= fee.amount) {
        return NextResponse.json(
          { error: 'Invalid amount for partial payment' },
          { status: 400 }
        )
      }
      finalAmountPaid = amountPaid
    } else if (status === 'PAID') {
      finalAmountPaid = fee.amount
    } else if (status === 'WAIVED') {
      finalAmountPaid = 0
    }

    // Update fee
    const updatedFee = await prisma.fee.update({
      where: { id: params.id },
      data: {
        status,
        amountPaid: finalAmountPaid,
        paidAt: status === 'PAID' || status === 'PARTIALLY_PAID' ? new Date() : null,
        paymentMode: status !== 'WAIVED' ? paymentMode : null,
        remarks,
        markedById: prismaUser.id,
      },
      include: {
        student: {
          select: {
            fullName: true,
            studentId: true,
          },
        },
        markedBy: {
          select: {
            fullName: true,
          },
        },
      },
    })

    return NextResponse.json(updatedFee)
  } catch (error) {
    console.error('HOD mark fee paid error:', error)
    return NextResponse.json(
      { error: 'Failed to update fee status' },
      { status: 500 }
    )
  }
}
