import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// Helper to verify HOD owns this subject
async function verifyHODAndSubject(request: NextRequest, subjectId: string) {
  const authResult = await verifyRole(request, ['HOD'])
  
  if (!authResult) {
    return { error: 'Forbidden', status: 403 }
  }

  const { prismaUser: user } = authResult
  const departmentId = user.departmentId

  if (!departmentId) {
    return { error: 'HOD not assigned to department', status: 400 }
  }

  const subject = await prisma.subject.findFirst({
    where: {
      id: subjectId,
      departmentId: departmentId,
    },
  })

  if (!subject) {
    return { error: 'Subject not found in your department', status: 404 }
  }

  return { user, subject, departmentId }
}

// GET - Get single subject
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await verifyHODAndSubject(request, params.id)
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const subjectWithDetails = await prisma.subject.findUnique({
      where: { id: params.id },
      include: {
        department: { select: { name: true, code: true } },
        batch: { select: { name: true, year: true, semester: true } },
        faculty: { select: { id: true, fullName: true, email: true } },
      },
    })

    return NextResponse.json(subjectWithDetails)
  } catch (error) {
    console.error('Get subject error:', error)
    return NextResponse.json({ error: 'Failed to fetch subject' }, { status: 500 })
  }
}

// PUT - Update subject
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await verifyHODAndSubject(request, params.id)
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const body = await request.json()
    const { name, code, facultyId } = body

    // Verify faculty belongs to HOD's department (if provided)
    if (facultyId) {
      const faculty = await prisma.user.findFirst({
        where: { id: facultyId, role: 'FACULTY', departmentId: result.departmentId },
      })
      if (!faculty) {
        return NextResponse.json({ error: 'Invalid faculty for your department' }, { status: 400 })
      }
    }

    const updatedSubject = await prisma.subject.update({
      where: { id: params.id },
      data: {
        name,
        code,
        facultyId: facultyId || null,
      },
      include: {
        department: { select: { name: true, code: true } },
        batch: { select: { name: true, year: true, semester: true } },
        faculty: { select: { id: true, fullName: true, email: true } },
      },
    })

    return NextResponse.json(updatedSubject)
  } catch (error) {
    console.error('Update subject error:', error)
    return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 })
  }
}

// DELETE - Delete subject
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await verifyHODAndSubject(request, params.id)
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    await prisma.subject.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Subject deleted successfully' })
  } catch (error) {
    console.error('Delete subject error:', error)
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 })
  }
}
