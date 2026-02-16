import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// GET - List subjects in HOD's department
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

    const subjects = await prisma.subject.findMany({
      where: {
        departmentId: departmentId,
        ...(batchId && { batchId }),
      },
      include: {
        department: { select: { name: true, code: true } },
        batch: { select: { name: true, year: true, semester: true } },
        faculty: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(subjects)
  } catch (error) {
    console.error('HOD subjects fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 })
  }
}

// POST - Create new subject in HOD's department
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
    const { name, code, batchId, facultyId, credits, type, electiveGroupId } = body

    if (!name || !code || !batchId) {
      return NextResponse.json({ error: 'Name, code, and batch are required' }, { status: 400 })
    }

    // Verify batch belongs to HOD's department
    const batch = await prisma.batch.findFirst({
      where: { id: batchId, departmentId },
    })

    if (!batch) {
      return NextResponse.json({ error: 'Invalid batch for your department' }, { status: 400 })
    }

    // Verify faculty
    if (facultyId) {
      const faculty = await prisma.user.findFirst({
        where: { id: facultyId, role: 'FACULTY', departmentId },
      })
      if (!faculty) {
        return NextResponse.json({ error: 'Invalid faculty for your department' }, { status: 400 })
      }
    }

    // Check duplicate code in batch
    const existingSubject = await prisma.subject.findFirst({
      where: { code, batchId },
    })

    if (existingSubject) {
      return NextResponse.json(
        { error: 'Subject code already exists for this batch' },
        { status: 409 }
      )
    }

    const newSubject = await prisma.subject.create({
      data: {
        name,
        code,
        departmentId,
        batchId,
        facultyId: facultyId || null,
        credits: credits ? parseInt(credits) : 3,
        type: type || 'CORE',
        electiveGroupId: type === 'ELECTIVE' ? electiveGroupId : null,
      },
      include: {
        department: { select: { name: true, code: true } },
        batch: { select: { name: true, year: true, semester: true } },
        faculty: { select: { id: true, fullName: true, email: true } },
      },
    })

    return NextResponse.json(newSubject, { status: 201 })
  } catch (error: any) {
    console.error('Create subject error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create subject' },
      { status: 500 }
    )
  }
}

// PUT - Update subject
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['HOD'])
    if (!authResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Subject ID required' }, { status: 400 })

    const { prismaUser: user } = authResult
    const departmentId = user.departmentId

    // Verify subject
    const existingSubject = await prisma.subject.findUnique({ where: { id } })
    if (!existingSubject || existingSubject.departmentId !== departmentId) {
      return NextResponse.json({ error: 'Subject not found or unauthorized' }, { status: 404 })
    }

    const body = await request.json()
    const { name, code, facultyId, credits, type, electiveGroupId } = body

    const updateData: any = {}
    if (name) updateData.name = name
    if (code) updateData.code = code
    if (facultyId !== undefined) updateData.facultyId = facultyId
    if (credits) updateData.credits = parseInt(credits)
    if (type) updateData.type = type
    if (type === 'ELECTIVE' && electiveGroupId) updateData.electiveGroupId = electiveGroupId
    else if (type === 'CORE') updateData.electiveGroupId = null

    const updatedSubject = await prisma.subject.update({
      where: { id },
      data: updateData,
      include: {
        faculty: { select: { id: true, fullName: true } }
      }
    })

    return NextResponse.json(updatedSubject)
  } catch (error) {
    console.error('Update subject error:', error)
    return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 })
  }
}

// DELETE - Delete subject
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['HOD'])
    if (!authResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Subject ID required' }, { status: 400 })

    const { prismaUser: user } = authResult
    const departmentId = user.departmentId

    const existingSubject = await prisma.subject.findUnique({ where: { id } })
    if (!existingSubject || existingSubject.departmentId !== departmentId) {
      return NextResponse.json({ error: 'Subject not found or unauthorized' }, { status: 404 })
    }

    await prisma.subject.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete subject error:', error)
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 })
  }
}
