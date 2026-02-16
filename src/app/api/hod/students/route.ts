import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'
import { auth } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

// GET - List students in HOD's department
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
    const search = searchParams.get('search') || ''
    const batchId = searchParams.get('batchId') || ''

    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        departmentId: departmentId,
        AND: [
          search ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { studentId: { contains: search, mode: 'insensitive' } },
            ],
          } : {},
          batchId ? {
            enrollments: {
              some: {
                batchId: batchId,
              },
            },
          } : {},
        ],
      },
      include: {
        department: { select: { name: true, code: true } },
        enrollments: {
          include: {
            batch: { select: { name: true, year: true, semester: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(students)
  } catch (error) {
    console.error('HOD students fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
  }
}

// POST - Create new student in HOD's department
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
    const { email, fullName, phone, studentId, password, batchId } = body

    if (!email || !fullName || !password) {
      return NextResponse.json({ error: 'Email, full name, and password are required' }, { status: 400 })
    }

    // Check if user already exists in Firebase
    try {
      await auth.getUserByEmail(email)
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error
      }
    }

    // Check if studentId already exists
    if (studentId) {
      const existingStudent = await prisma.user.findUnique({
        where: { studentId },
      })
      if (existingStudent) {
        return NextResponse.json(
          { error: 'Student ID already exists' },
          { status: 409 }
        )
      }
    }

    // Create user in Firebase Auth
    const firebaseUser = await auth.createUser({
      email,
      password,
      displayName: fullName,
    })

    // Create user in database with HOD's department
    const newStudent = await prisma.user.create({
      data: {
        firebaseUid: firebaseUser.uid,
        email,
        fullName,
        role: 'STUDENT',
        departmentId: departmentId,
        phone,
        studentId,
      },
      include: {
        department: { select: { name: true, code: true } },
      },
    })

    // If batchId provided, create enrollment
    if (batchId) {
      await prisma.enrollment.create({
        data: {
          studentId: newStudent.id,
          batchId: batchId,
          academicYear: new Date().getFullYear().toString(),
        },
      })
    }

    return NextResponse.json(newStudent, { status: 201 })
  } catch (error: any) {
    console.error('Create student error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create student' },
      { status: 500 }
    )
  }
}
