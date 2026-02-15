import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/firebase-admin'
import { createUserSchema } from '@/lib/validations'

// Helper to verify admin
async function verifyAdmin(request: NextRequest) {
  const firebaseUid = request.headers.get('x-firebase-uid')
  
  if (!firebaseUid) {
    return { error: 'Unauthorized', status: 401 }
  }

  const user = await prisma.user.findUnique({ where: { firebaseUid } })

  if (!user || user.role !== 'PRINCIPAL') {
    return { error: 'Forbidden', status: 403 }
  }

  return { user }
}

// GET - List all users
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const users = await prisma.user.findMany({
      include: {
        department: { select: { name: true, id: true } }
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(users)
  } catch (error: any) {
    console.error('Admin users error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    
    // Validate input with Zod
    const validationResult = createUserSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }
    
    const { email, fullName, role, departmentId, phone, studentId, password } = validationResult.data

    // Check if user already exists in Firebase
    try {
      await auth.getUserByEmail(email)
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    } catch (error: any) {
      // User doesn't exist, continue
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

    // Create user in database
    const userData: any = {
      firebaseUid: firebaseUser.uid,
      email,
      fullName,
      role,
      phone,
    }

    // Add optional fields
    if (departmentId) userData.departmentId = departmentId
    if (studentId) userData.studentId = studentId

    const newUser = await prisma.user.create({
      data: userData,
      include: {
        department: { select: { name: true, id: true } }
      }
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error: any) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    )
  }
}
