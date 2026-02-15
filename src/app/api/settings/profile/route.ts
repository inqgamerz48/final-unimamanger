import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateProfileSchema } from '@/lib/validations'
import { verifyAuthToken } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAuthToken(request)
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { firebaseUid: authResult.uid }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    
    // Validate input
    const validationResult = updateProfileSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { fullName, phone, bio } = validationResult.data

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(fullName && { fullName }),
        ...(phone !== undefined && { phone }),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        studentId: true,
      }
    })

    // Update bio in user settings if provided
    if (bio !== undefined) {
      await prisma.userSettings.upsert({
        where: { userId: user.id },
        update: { bio },
        create: {
          userId: user.id,
          bio,
          notifications: true,
          emailAlerts: true,
          feeReminders: true,
          theme: 'dark',
          language: 'en',
        }
      })
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
