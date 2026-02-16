import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateCollegeSettingsSchema } from '@/lib/validations'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// GET - Get college settings
export async function GET(request: NextRequest) {
  try {
    const settings = await prisma.collegeSettings.findUnique({
      where: { id: 'default' }
    })

    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json({
        id: 'default',
        collegeName: 'My College',
        collegeCode: 'UNI',
        logoUrl: null,
        address: null,
        phone: null,
        email: null,
        academicYear: '2024-2025',
        isSetupComplete: false,
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Get college settings error:', error)
    return NextResponse.json({ error: 'Failed to fetch college settings' }, { status: 500 })
  }
}

// PUT - Update college settings (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['PRINCIPAL'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate input
    const validationResult = updateCollegeSettingsSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    // Update or create college settings
    const settings = await prisma.collegeSettings.upsert({
      where: { id: 'default' },
      update: validationResult.data,
      create: {
        id: 'default',
        ...validationResult.data,
        collegeName: validationResult.data.collegeName || 'My College',
        collegeCode: validationResult.data.collegeCode || 'UNI',
        academicYear: validationResult.data.academicYear || '2024-2025',
        isSetupComplete: false,
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Update college settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update college settings' },
      { status: 500 }
    )
  }
}
