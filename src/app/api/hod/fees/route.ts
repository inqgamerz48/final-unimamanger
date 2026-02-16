import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createFeeSchema, updateFeeSchema } from '@/lib/validations'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// GET - List fees for HOD's department
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['HOD'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized - HOD access required' }, { status: 401 })
    }

    const { prismaUser } = authResult
    const departmentId = prismaUser.departmentId

    if (!departmentId) {
      return NextResponse.json({ error: 'HOD not assigned to any department' }, { status: 400 })
    }
    const { searchParams } = new URL(request.url)
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Filters
    const batchId = searchParams.get('batchId')
    const status = searchParams.get('status')
    const feeType = searchParams.get('feeType')
    const academicYear = searchParams.get('academicYear')
    const search = searchParams.get('search')

    // Build where clause - scope to HOD's department
    const where: any = {
      student: {
        departmentId,
        role: 'STUDENT',
      }
    }

    if (batchId) {
      where.student.enrollments = {
        some: { batchId }
      }
    }

    if (status) {
      where.status = status
    }

    if (feeType) {
      where.feeType = feeType
    }

    if (academicYear) {
      where.academicYear = academicYear
    }

    // Search by student name or ID
    if (search) {
      where.student.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { studentId: { contains: search, mode: 'insensitive' } },
      ]
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
            enrollments: {
              include: {
                batch: {
                  select: { name: true, year: true, semester: true }
                }
              }
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
    console.error('HOD fees error:', error)
    return NextResponse.json({ error: 'Failed to fetch fees' }, { status: 500 })
  }
}

// POST - Create fee for department student
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['HOD'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized - HOD access required' }, { status: 401 })
    }

    const { prismaUser } = authResult
    const departmentId = prismaUser.departmentId

    if (!departmentId) {
      return NextResponse.json({ error: 'HOD not assigned to any department' }, { status: 400 })
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

    // Verify student exists and belongs to HOD's department
    const student = await prisma.user.findFirst({
      where: { 
        id: studentId, 
        role: 'STUDENT',
        departmentId 
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found in your department' }, { status: 404 })
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
    console.error('HOD create fee error:', error)
    return NextResponse.json(
      { error: 'Failed to create fee' },
      { status: 500 }
    )
  }
}
