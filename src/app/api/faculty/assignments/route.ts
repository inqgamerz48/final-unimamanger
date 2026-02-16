import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['FACULTY'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prismaUser: user } = authResult
    const body = await request.json()
    const { subjectId, title, description, dueDate } = body

    const assignment = await prisma.assignment.create({
      data: {
        subjectId,
        title,
        description,
        dueDate: new Date(dueDate),
        createdById: user.id,
      }
    })

    return NextResponse.json(assignment)
  } catch (error: any) {
    console.error('Create assignment error:', error)
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['FACULTY'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prismaUser: user } = authResult

    const subjects = await prisma.subject.findMany({
      where: { facultyId: user.id },
      select: { id: true }
    })
    const subjectIds = subjects.map(s => s.id)

    const assignments = await prisma.assignment.findMany({
      where: { subjectId: { in: subjectIds } },
      include: {
        subject: { select: { name: true, code: true } },
        _count: { select: { submissions: true } }
      },
      orderBy: { dueDate: 'desc' },
    })

    return NextResponse.json(assignments)
  } catch (error: any) {
    console.error('Get assignments error:', error)
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }
}
