import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'
import { auth } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

// Helper to verify HOD owns this faculty
async function verifyHODAndFaculty(request: NextRequest, facultyId: string) {
  const authResult = await verifyRole(request, ['HOD'])
  
  if (!authResult) {
    return { error: 'Forbidden', status: 403 }
  }

  const { prismaUser: user } = authResult
  const departmentId = user.departmentId

  if (!departmentId) {
    return { error: 'HOD not assigned to department', status: 400 }
  }

  const faculty = await prisma.user.findFirst({
    where: {
      id: facultyId,
      role: 'FACULTY',
      departmentId: departmentId,
    },
  })

  if (!faculty) {
    return { error: 'Faculty not found in your department', status: 404 }
  }

  return { user, faculty, departmentId }
}

// GET - Get single faculty member
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await verifyHODAndFaculty(request, params.id)
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const facultyWithDetails = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        department: { select: { name: true, code: true } },
        subjects: {
          include: {
            batch: { select: { name: true, year: true, semester: true } },
          },
        },
      },
    })

    return NextResponse.json(facultyWithDetails)
  } catch (error) {
    console.error('Get faculty error:', error)
    return NextResponse.json({ error: 'Failed to fetch faculty' }, { status: 500 })
  }
}

// PUT - Update faculty
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await verifyHODAndFaculty(request, params.id)
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const body = await request.json()
    const { fullName, phone, isActive } = body

    const updatedFaculty = await prisma.user.update({
      where: { id: params.id },
      data: {
        fullName,
        phone,
        isActive,
      },
      include: {
        department: { select: { name: true, code: true } },
      },
    })

    return NextResponse.json(updatedFaculty)
  } catch (error) {
    console.error('Update faculty error:', error)
    return NextResponse.json({ error: 'Failed to update faculty' }, { status: 500 })
  }
}

// DELETE - Delete faculty
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await verifyHODAndFaculty(request, params.id)
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const { faculty } = result

    // Delete from Firebase Auth
    try {
      await auth.deleteUser(faculty.firebaseUid)
    } catch (error) {
      console.error('Firebase delete error:', error)
      // Continue with DB deletion even if Firebase fails
    }

    // Delete from database
    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Faculty deleted successfully' })
  } catch (error) {
    console.error('Delete faculty error:', error)
    return NextResponse.json({ error: 'Failed to delete faculty' }, { status: 500 })
  }
}
