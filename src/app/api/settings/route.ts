import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthToken } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// Default settings to return when UserSettings table doesn't exist
const defaultSettings = {
  notifications: true,
  emailAlerts: true,
  feeReminders: true,
  theme: 'dark',
  language: 'en',
  bio: '',
}

// GET - Get user settings (returns defaults since UserSettings table doesn't exist)
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuthToken(request)
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return default settings since UserSettings table doesn't exist in DB yet
    return NextResponse.json(defaultSettings)
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PUT - Update user settings (mock since UserSettings table doesn't exist)
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAuthToken(request)
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Return merged settings (mock success since table doesn't exist)
    const updatedSettings = {
      ...defaultSettings,
      ...body,
    }

    return NextResponse.json(updatedSettings)
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
