import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// GET - Get attendance statistics for HOD's department
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['HOD'])
    
    if (!authResult) {
      return NextResponse.json({ error: 'Forbidden - HOD access required' }, { status: 403 })
    }

    const { prismaUser: user } = authResult
    const departmentId = user.departmentId

    if (!departmentId) {
      return NextResponse.json({ error: 'HOD not assigned to any department' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get('batchId') || ''
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Get all batches in department
    const batches = await prisma.batch.findMany({
      where: { departmentId },
      select: { id: true, name: true, year: true, semester: true },
    })

    const batchIds = batches.map(b => b.id)

    // Get attendance statistics
    const [totalAttendance, presentCount, absentCount, lateCount, excusedCount] = await Promise.all([
      prisma.attendance.count({
        where: {
          date: new Date(date),
          subject: {
            batchId: batchId || { in: batchIds },
          },
        },
      }),
      prisma.attendance.count({
        where: {
          date: new Date(date),
          status: 'PRESENT',
          subject: {
            batchId: batchId || { in: batchIds },
          },
        },
      }),
      prisma.attendance.count({
        where: {
          date: new Date(date),
          status: 'ABSENT',
          subject: {
            batchId: batchId || { in: batchIds },
          },
        },
      }),
      prisma.attendance.count({
        where: {
          date: new Date(date),
          status: 'LATE',
          subject: {
            batchId: batchId || { in: batchIds },
          },
        },
      }),
      prisma.attendance.count({
        where: {
          date: new Date(date),
          status: 'EXCUSED',
          subject: {
            batchId: batchId || { in: batchIds },
          },
        },
      }),
    ])

    // Get recent attendance records
    const recentAttendance = await prisma.attendance.findMany({
      where: {
        subject: {
          batchId: batchId || { in: batchIds },
        },
      },
      include: {
        student: { select: { fullName: true, studentId: true } },
        subject: { select: { name: true, code: true } },
        markedBy: { select: { fullName: true } },
      },
      orderBy: { date: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      stats: {
        totalAttendance,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        attendanceRate: totalAttendance > 0 ? ((presentCount + lateCount) / totalAttendance * 100).toFixed(1) : '0',
      },
      batches,
      recentAttendance,
    })
  } catch (error) {
    console.error('HOD attendance fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
  }
}
