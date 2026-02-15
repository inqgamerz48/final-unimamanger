import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const firebaseUid = request.headers.get('x-firebase-uid')
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { firebaseUid } })

    if (!user || user.role !== 'FACULTY') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const subject = await prisma.subject.findUnique({
      where: { id: params.id },
      include: { batch: true }
    })

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    // SECURITY: Verify faculty is assigned to this subject
    if (subject.facultyId !== user.id) {
      return NextResponse.json({ error: 'Forbidden - Not assigned to this subject' }, { status: 403 })
    }

    const students = await prisma.enrollment.findMany({
      where: { batchId: subject.batchId },
      include: {
        student: {
          select: { id: true, fullName: true, studentId: true }
        }
      }
    })

    return NextResponse.json(students.map(e => e.student))
  } catch (error: any) {
    console.error('Get students error:', error)
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
  }
}
