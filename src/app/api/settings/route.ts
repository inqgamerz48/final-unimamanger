import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateSettingsSchema } from '@/lib/validations'
import { verifyAuthToken } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// GET - Get user settings
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuthToken(request)
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { firebaseUid: authResult.uid },
      include: { userSettings: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If no settings exist, create default settings
    if (!user.userSettings) {
      const settings = await prisma.userSettings.create({
        data: {
          userId: user.id,
          notifications: true,
          emailAlerts: true,
          feeReminders: true,
          theme: 'dark',
          language: 'en',
        }
      })
      return NextResponse.json(settings)
    }

    return NextResponse.json(user.userSettings)
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PUT - Update user settings
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
    const validationResult = updateSettingsSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    // Update or create settings
    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: validationResult.data,
      create: {
        userId: user.id,
        ...validationResult.data,
        notifications: validationResult.data.notifications ?? true,
        emailAlerts: validationResult.data.emailAlerts ?? true,
        feeReminders: validationResult.data.feeReminders ?? true,
        theme: validationResult.data.theme ?? 'dark',
        language: validationResult.data.language ?? 'en',
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
