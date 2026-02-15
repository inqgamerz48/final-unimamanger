import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { setupCollegeSchema } from '@/lib/validations'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// POST - Save college settings during setup
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['PRINCIPAL'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate input
    const validationResult = setupCollegeSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { collegeName, collegeCode, address, phone, email, academicYear, logoUrl } = validationResult.data

    // Update or create college settings
    const settings = await prisma.collegeSettings.upsert({
      where: { id: 'default' },
      update: {
        collegeName,
        collegeCode,
        address,
        phone,
        email,
        academicYear,
        logoUrl,
      },
      create: {
        id: 'default',
        collegeName,
        collegeCode,
        address,
        phone,
        email,
        academicYear,
        logoUrl,
        isSetupComplete: false,
      },
    })

    return NextResponse.json(settings, { status: 200 })
  } catch (error) {
    console.error('Setup college error:', error)
    return NextResponse.json({ error: 'Failed to save college settings' }, { status: 500 })
  }
}
