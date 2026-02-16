import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// GET - List batches in HOD's department
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

    const batches = await prisma.batch.findMany({
      where: { departmentId },
      include: {
        _count: { select: { enrollments: true } }
      },
      orderBy: [
        { year: 'desc' },
        { semester: 'asc' },
      ],
    })

    return NextResponse.json(batches)
  } catch (error) {
    console.error('HOD batches fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 })
  }
}

// POST - Create new batch in HOD's department
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
    const { name, year, semester } = body

    if (!name || !year || !semester) {
      return NextResponse.json({ error: 'Name, year, and semester are required' }, { status: 400 })
    }

    // Check if batch already exists
    const existingBatch = await prisma.batch.findFirst({
      where: {
        departmentId,
        year: parseInt(year),
        semester: parseInt(semester),
      },
    })

    if (existingBatch) {
      return NextResponse.json(
        { error: 'Batch already exists for this year and semester' },
        { status: 409 }
      )
    }

    const newBatch = await prisma.batch.create({
      data: {
        name,
        year: parseInt(year),
        semester: parseInt(semester),
        departmentId,
      },
      include: {
        _count: { select: { enrollments: true } }
      },
    })

    return NextResponse.json(newBatch, { status: 201 })
  } catch (error: any) {
    console.error('Create batch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create batch' },
      { status: 500 }
    )
  }
}

// PUT - Update batch (e.g. Timetable URL)
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['HOD'])
    if (!authResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Batch ID required' }, { status: 400 })

    const { prismaUser: user } = authResult
    const departmentId = user.departmentId

    // Verify batch belongs to HOD's department
    const existingBatch = await prisma.batch.findUnique({ where: { id } })
    if (!existingBatch || existingBatch.departmentId !== departmentId) {
      return NextResponse.json({ error: 'Batch not found or unauthorized' }, { status: 404 })
    }

    const body = await request.json()
    // Allowed updates
    const { name, timetableUrl } = body

    const updateData: any = {}
    if (name) updateData.name = name
    if (timetableUrl !== undefined) updateData.timetableUrl = timetableUrl

    const updatedBatch = await prisma.batch.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(updatedBatch)
  } catch (error) {
    console.error('Update batch error:', error)
    return NextResponse.json({ error: 'Failed to update batch' }, { status: 500 })
  }
}
