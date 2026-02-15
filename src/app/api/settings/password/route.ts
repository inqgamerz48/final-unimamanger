import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase-admin'
import { changePasswordSchema } from '@/lib/validations'
import { verifyAuthToken } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// PUT - Change user password
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAuthToken(request)
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const firebaseUid = authResult.uid

    const body = await request.json()
    
    // Validate input
    const validationResult = changePasswordSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { newPassword } = validationResult.data

    // Update password in Firebase Auth
    await auth.updateUser(firebaseUid, {
      password: newPassword,
    })

    return NextResponse.json({ message: 'Password updated successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    )
  }
}
