import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { bulkCreateFeeSchema } from '@/lib/validations'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// POST - Bulk create fees for batch or department
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['PRINCIPAL'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate input
    const validationResult = bulkCreateFeeSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { batchId, departmentId, amount, dueDate, feeType, description, academicYear } = validationResult.data

    if (!batchId && !departmentId) {
      return NextResponse.json(
        { error: 'Either batchId or departmentId is required' },
        { status: 400 }
      )
    }

    // Get students based on filter
    let students: any[] = []

    if (batchId) {
      // Get students in specific batch
      const enrollments = await prisma.enrollment.findMany({
        where: { batchId },
        include: {
          student: {
            select: { id: true, fullName: true, studentId: true }
          }
        }
      })
      students = enrollments.map(e => e.student)
    } else if (departmentId) {
      // Get all students in department (across all batches)
      students = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
          departmentId,
        },
        select: { id: true, fullName: true, studentId: true }
      })
    }

    if (students.length === 0) {
      return NextResponse.json(
        { error: 'No students found for the selected criteria' },
        { status: 404 }
      )
    }

    // Create fees for all students using createMany for better performance
    const createdFees = await prisma.$transaction(async (tx) => {
      const fees = []
      for (const student of students) {
        const fee = await tx.fee.create({
          data: {
            studentId: student.id,
            amount,
            dueDate: new Date(dueDate),
            feeType,
            description,
            academicYear,
            status: 'PENDING',
            amountPaid: 0,
          }
        })
        fees.push(fee)
      }
      return fees
    })

    return NextResponse.json({
      message: `Successfully created ${createdFees.length} fees`,
      count: createdFees.length,
      fees: createdFees.map((fee, index) => ({
        ...fee,
        student: students[index],
      })),
    }, { status: 201 })
  } catch (error) {
    console.error('Bulk create fees error:', error)
    return NextResponse.json(
      { error: 'Failed to create fees' },
      { status: 500 }
    )
  }
}
