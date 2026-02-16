import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'
import { auth } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

// GET - List faculty in HOD's department
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

    const faculty = await prisma.user.findMany({
      where: {
        role: 'FACULTY',
        departmentId: departmentId,
        OR: search ? [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ] : undefined,
      },
      include: {
        department: { select: { name: true, code: true } },
        subjects: {
          include: {
            batch: { select: { name: true, year: true, semester: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(faculty)
  } catch (error) {
    console.error('HOD faculty fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch faculty' }, { status: 500 })
  }
}

// POST - Create new faculty in HOD's department
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
    const { email, fullName, phone, password } = body

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

    // Create user in Firebase Auth
    const firebaseUser = await auth.createUser({
      email,
      password,
      displayName: fullName,
    })

    // Create user in database with HOD's department
    const newFaculty = await prisma.user.create({
      data: {
        firebaseUid: firebaseUser.uid,
        email,
        fullName,
        role: 'FACULTY',
        departmentId: departmentId,
        phone,
      },
      include: {
        department: { select: { name: true, code: true } },
      },
    })

    return NextResponse.json(newFaculty, { status: 201 })
  } catch (error: any) {
    console.error('Create faculty error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create faculty' },
      { status: 500 }
    )
  }
}
