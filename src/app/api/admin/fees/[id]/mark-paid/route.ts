import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { markFeePaidSchema } from '@/lib/validations'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// POST - Mark fee as paid/partially paid
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyRole(request, ['PRINCIPAL'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const { prismaUser } = authResult
    const { id } = params
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

    // Check if fee exists
    const existingFee = await prisma.fee.findUnique({
      where: { id }
    })

    if (!existingFee) {
      return NextResponse.json({ error: 'Fee not found' }, { status: 404 })
    }

    // Calculate amount paid
    let finalAmountPaid = amountPaid || existingFee.amount
    
    if (status === 'PARTIALLY_PAID') {
      if (!amountPaid || amountPaid <= 0 || amountPaid >= existingFee.amount) {
        return NextResponse.json(
          { error: 'Invalid amount for partial payment. Must be greater than 0 and less than total amount.' },
          { status: 400 }
        )
      }
      finalAmountPaid = amountPaid
    } else if (status === 'PAID') {
      finalAmountPaid = existingFee.amount
    } else if (status === 'WAIVED') {
      finalAmountPaid = 0
    }

    // Update fee
    const fee = await prisma.fee.update({
      where: { id },
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

    return NextResponse.json(fee)
  } catch (error) {
    console.error('Mark fee paid error:', error)
    return NextResponse.json(
      { error: 'Failed to update fee status' },
      { status: 500 }
    )
  }
}
