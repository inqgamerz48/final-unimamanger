import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const firebaseUid = request.headers.get('x-firebase-uid')
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { firebaseUid } })

    if (!user || user.role !== 'FACULTY') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { subjectId, date, records } = body

    // SECURITY: Verify faculty is assigned to this subject
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, facultyId: user.id }
    })

    if (!subject) {
      return NextResponse.json({ error: 'Forbidden - Not authorized for this subject' }, { status: 403 })
    }

    const attendanceRecords = Object.entries(records).map(([studentId, status]) => ({
      studentId,
      subjectId,
      date: new Date(date),
      status: status as string,
      markedById: user.id,
    }))

    for (const record of attendanceRecords) {
      await prisma.attendance.upsert({
        where: {
          studentId_subjectId_date: {
            studentId: record.studentId,
            subjectId: record.subjectId,
            date: record.date,
          }
        },
        update: { status: record.status, markedById: user.id },
        create: record,
      })
    }

    return NextResponse.json({ success: true, count: attendanceRecords.length })
  } catch (error: any) {
    console.error('Mark attendance error:', error)
    return NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 })
  }
}
