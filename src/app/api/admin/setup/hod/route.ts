import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/firebase-admin'
import { setupHodSchema } from '@/lib/validations'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// POST - Create HOD during setup
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['PRINCIPAL'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate input
    const validationResult = setupHodSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { fullName, email, phone, password } = validationResult.data
    const { departmentId } = body

    if (!departmentId) {
      return NextResponse.json(
        { error: 'Department ID is required' },
        { status: 400 }
      )
    }

    // Check if user already exists in Firebase
    try {
      await auth.getUserByEmail(email)
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    } catch (error) {
      const firebaseError = error as { code?: string }
      if (firebaseError.code !== 'auth/user-not-found') {
        throw error
      }
    }

    // Create user in Firebase Auth
    const firebaseUser = await auth.createUser({
      email,
      password,
      displayName: fullName,
    })

    // Create HOD in database
    const hod = await prisma.user.create({
      data: {
        firebaseUid: firebaseUser.uid,
        email,
        fullName,
        role: 'HOD',
        departmentId,
        phone,
      },
    })

    // Assign HOD to department
    await prisma.department.update({
      where: { id: departmentId },
      data: { hodId: hod.id },
    })

    return NextResponse.json(hod, { status: 201 })
  } catch (error) {
    console.error('Setup HOD error:', error)
    return NextResponse.json(
      { error: 'Failed to create HOD' },
      { status: 500 }
    )
  }
}
