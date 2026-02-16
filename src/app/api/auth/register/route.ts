import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// SECURITY: This endpoint is RESTRICTED to admin users only
// Public registration is DISABLED - all users must be created by a PRINCIPAL

export async function POST(request: NextRequest) {
  try {
    // SECURITY CHECK: Verify requesting user is a PRINCIPAL
    const authResult = await verifyRole(request, ['PRINCIPAL'])
    if (!authResult) {
      return NextResponse.json(
        { error: 'Unauthorized - Only PRINCIPAL can create users' },
        { status: 401 }
      )
    }

    const { prismaUser: requestingUser } = authResult

    // Parse request body
    const body = await request.json()
    const { firebaseUid: newUserFirebaseUid, email, fullName, role, departmentId, phone, studentId } = body

    // Validate required fields
    if (!newUserFirebaseUid || !email || !fullName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { firebaseUid: newUserFirebaseUid },
    })

    if (existingUser) {
      return NextResponse.json(existingUser)
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    })

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Create new user
    const userData: any = {
      firebaseUid: newUserFirebaseUid,
      email,
      fullName,
      role,
    }

    // Add optional fields
    if (departmentId) userData.departmentId = departmentId
    if (phone) userData.phone = phone
    if (studentId) userData.studentId = studentId

    const user = await prisma.user.create({
      data: userData,
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    )
  }
}
