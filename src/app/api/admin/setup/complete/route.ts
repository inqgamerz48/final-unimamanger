import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// POST - Mark setup as complete
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['PRINCIPAL'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    // Update college settings to mark setup as complete
    const settings = await prisma.collegeSettings.update({
      where: { id: 'default' },
      data: {
        isSetupComplete: true,
        setupCompletedAt: new Date(),
      },
    })

    return NextResponse.json({ 
      message: 'Setup completed successfully',
      settings 
    }, { status: 200 })
  } catch (error) {
    console.error('Complete setup error:', error)
    return NextResponse.json({ error: 'Failed to complete setup' }, { status: 500 })
  }
}
