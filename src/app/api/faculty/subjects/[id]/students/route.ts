import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyRole(request, ['FACULTY'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prismaUser: user } = authResult

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
