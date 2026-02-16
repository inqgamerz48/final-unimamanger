import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const markAttendanceSchema = z.object({
  batchId: z.string().min(1, 'Batch ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  records: z.array(z.object({
    studentId: z.string(),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'])
  })).min(1, 'At least one student record is required')
})

export async function POST(request: NextRequest) {
  try {
    // Verify faculty role
    const authResult = await verifyRole(request, ['FACULTY', 'HOD', 'PRINCIPAL'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = markAttendanceSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.errors }, { status: 400 })
    }

    const { batchId, subjectId, date, records } = validation.data
    const attendanceDate = new Date(date)
    const markerId = authResult.prismaUser.id

    // Use a transaction to upsert all records
    const results = await prisma.$transaction(
      records.map((record) =>
        prisma.attendance.upsert({
          where: {
            studentId_subjectId_date: {
              studentId: record.studentId,
              subjectId: subjectId,
              date: attendanceDate
            }
          },
          update: {
            status: record.status,
            markedById: markerId,
            batchId: batchId // Ensure batchId is updated if it was missing
          },
          create: {
            studentId: record.studentId,
            subjectId: subjectId,
            batchId: batchId,
            date: attendanceDate,
            status: record.status,
            markedById: markerId
          }
        })
      )
    )

    return NextResponse.json({
      message: 'Attendance marked successfully',
      count: results.length
    })

  } catch (error: any) {
    console.error('Mark attendance error:', error)
    return NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['FACULTY', 'HOD', 'PRINCIPAL', 'STUDENT'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get('batchId')
    const subjectId = searchParams.get('subjectId')
    const date = searchParams.get('date')
    const studentId = searchParams.get('studentId')

    const where: any = {}

    if (batchId) where.batchId = batchId
    if (subjectId) where.subjectId = subjectId
    if (date) {
      const d = new Date(date)
      where.date = d
    }

    // Students can only see their own attendance
    if (authResult.prismaUser.role === 'STUDENT') {
      where.studentId = authResult.prismaUser.id
    } else if (studentId) {
      where.studentId = studentId
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        student: { select: { id: true, fullName: true, studentId: true } },
        subject: { select: { name: true, code: true } }
      },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json(attendance)

  } catch (error) {
    console.error('Fetch attendance error:', error)
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
  }
}
