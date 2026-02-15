import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// SECURITY: This endpoint is RESTRICTED to admin users only
// Public registration is DISABLED - all users must be created by a PRINCIPAL

export async function POST(request: NextRequest) {
  try {
    // SECURITY CHECK 1: Verify request has Firebase auth header
    const firebaseUid = request.headers.get('x-firebase-uid')
    
    if (!firebaseUid) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      )
    }

    // SECURITY CHECK 2: Verify requesting user exists and is a PRINCIPAL
    const requestingUser = await prisma.user.findUnique({
      where: { firebaseUid }
    })

    if (!requestingUser) {
      return NextResponse.json(
        { error: 'Unauthorized - User not found' },
        { status: 401 }
      )
    }

    if (requestingUser.role !== 'PRINCIPAL') {
      return NextResponse.json(
        { error: 'Forbidden - Only PRINCIPAL can create users' },
        { status: 403 }
      )
    }

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

    // SECURITY CHECK 3: Prevent privilege escalation - only PRINCIPAL can create PRINCIPAL
    if (role === 'PRINCIPAL' && requestingUser.role !== 'PRINCIPAL') {
      return NextResponse.json(
        { error: 'Forbidden - Cannot create PRINCIPAL users' },
        { status: 403 }
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
