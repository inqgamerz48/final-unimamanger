import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createFeeSchema } from '@/lib/validations'
import { verifyRole } from '@/lib/auth-verification'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

// GET - List all fees with filters
export async function GET(request: NextRequest) {
  try {
    // Verify admin role using Firebase token
    const authResult = await verifyRole(request, ['PRINCIPAL', 'HOD'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Filters
    const studentId = searchParams.get('studentId')
    const departmentId = searchParams.get('departmentId')
    const batchId = searchParams.get('batchId')
    const status = searchParams.get('status')
    const feeType = searchParams.get('feeType')
    const academicYear = searchParams.get('academicYear')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')

    // Build where clause with proper typing
    const where: Prisma.FeeWhereInput = {}

    if (studentId) {
      where.studentId = studentId
    }

    if (status) {
      where.status = status as Prisma.EnumFeeStatusFilter
    }

    if (feeType) {
      where.feeType = feeType as Prisma.EnumFeeTypeFilter
    }

    if (academicYear) {
      where.academicYear = academicYear
    }

    if (startDate || endDate) {
      where.dueDate = {}
      if (startDate) where.dueDate.gte = new Date(startDate)
      if (endDate) where.dueDate.lte = new Date(endDate)
    }

    // Build student filter
    let studentFilter: Prisma.UserWhereInput = {}

    // Search by student name or ID
    if (search) {
      studentFilter = {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { studentId: { contains: search, mode: 'insensitive' } },
        ],
      }
    }

    // Filter by department/batch through student enrollments
    if (departmentId || batchId) {
      studentFilter = {
        ...studentFilter,
        enrollments: {
          some: {
            ...(departmentId && {
              batch: { departmentId }
            }),
            ...(batchId && { batchId }),
          },
        },
      }
    }

    // Apply student filter if it has any properties
    if (Object.keys(studentFilter).length > 0) {
      where.student = studentFilter
    }

    // Get total count
    const total = await prisma.fee.count({ where })

    // Get fees
    const fees = await prisma.fee.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            studentId: true,
            department: {
              select: { name: true, code: true }
            },
          },
        },
        markedBy: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    return NextResponse.json({
      fees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Admin fees error:', error)
    return NextResponse.json({ error: 'Failed to fetch fees' }, { status: 500 })
  }
}

// POST - Create new fee
export async function POST(request: NextRequest) {
  try {
    // Verify admin role using Firebase token
    const authResult = await verifyRole(request, ['PRINCIPAL'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = createFeeSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { studentId, amount, dueDate, feeType, description, academicYear } = validationResult.data

    // Verify student exists
    const student = await prisma.user.findFirst({
      where: { id: studentId, role: 'STUDENT' }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Create fee
    const fee = await prisma.fee.create({
      data: {
        studentId,
        amount,
        dueDate: new Date(dueDate),
        feeType,
        description,
        academicYear,
        status: 'PENDING',
      },
      include: {
        student: {
          select: {
            fullName: true,
            studentId: true,
          },
        },
      },
    })

    return NextResponse.json(fee, { status: 201 })
  } catch (error) {
    console.error('Create fee error:', error)
    return NextResponse.json(
      { error: 'Failed to create fee' },
      { status: 500 }
    )
  }
}
