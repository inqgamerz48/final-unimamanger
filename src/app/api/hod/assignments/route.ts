import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// GET - List assignments in HOD's department
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
    const subjectId = searchParams.get('subjectId') || ''

    // Get all subjects in HOD's department
    const departmentSubjects = await prisma.subject.findMany({
      where: { departmentId },
      select: { id: true },
    })

    const subjectIds = departmentSubjects.map(s => s.id)

    const assignments = await prisma.assignment.findMany({
      where: {
        subjectId: subjectId || { in: subjectIds },
      },
      include: {
        subject: {
          include: {
            batch: { select: { name: true, year: true, semester: true } },
            faculty: { select: { fullName: true } },
          },
        },
        createdBy: { select: { fullName: true, role: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error('HOD assignments fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }
}

// POST - Create new assignment in HOD's department
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { title, description, subjectId, dueDate } = body

    if (!title || !subjectId || !dueDate) {
      return NextResponse.json({ error: 'Title, subject, and due date are required' }, { status: 400 })
    }

    // Verify subject belongs to HOD's department
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, departmentId },
    })

    if (!subject) {
      return NextResponse.json({ error: 'Invalid subject for your department' }, { status: 400 })
    }

    const newAssignment = await prisma.assignment.create({
      data: {
        title,
        description,
        subjectId,
        dueDate: new Date(dueDate),
        createdById: user.id,
      },
      include: {
        subject: {
          include: {
            batch: { select: { name: true, year: true, semester: true } },
          },
        },
        createdBy: { select: { fullName: true, role: true } },
      },
    })

    return NextResponse.json(newAssignment, { status: 201 })
  } catch (error: any) {
    console.error('Create assignment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create assignment' },
      { status: 500 }
    )
  }
}
