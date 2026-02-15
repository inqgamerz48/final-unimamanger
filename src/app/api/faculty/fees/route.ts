import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

// GET - View fees for students in faculty's subjects (read-only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['FACULTY'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized - Faculty access required' }, { status: 401 })
    }

    const { prismaUser } = authResult

    // Get list of student IDs that are in faculty's subjects
    const userWithSubjects = await prisma.user.findUnique({
      where: { id: prismaUser.id },
      include: { 
        subjects: {
          include: {
            batch: {
              include: {
                enrollments: {
                  include: {
                    student: {
                      select: { id: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    const studentIds = userWithSubjects?.subjects.flatMap(subject => 
      subject.batch.enrollments.map(enrollment => enrollment.student.id)
    ) || []

    const uniqueStudentIds = [...new Set(studentIds)]
    const { searchParams } = new URL(request.url)
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Filters
    const subjectId = searchParams.get('subjectId')
    const status = searchParams.get('status')
    const academicYear = searchParams.get('academicYear')
    const search = searchParams.get('search')

    if (uniqueStudentIds.length === 0) {
      return NextResponse.json({
        fees: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      })
    }

    // Build where clause
    const where: any = {
      studentId: { in: uniqueStudentIds }
    }

    if (status) {
      where.status = status
    }

    if (academicYear) {
      where.academicYear = academicYear
    }

    // Search by student name or ID
    if (search) {
      where.student = {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { studentId: { contains: search, mode: 'insensitive' } },
        ],
      }
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
    console.error('Faculty fees error:', error)
    return NextResponse.json({ error: 'Failed to fetch fees' }, { status: 500 })
  }
}
