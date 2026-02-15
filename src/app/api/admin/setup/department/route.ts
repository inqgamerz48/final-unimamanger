import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { setupDepartmentSchema } from '@/lib/validations'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// POST - Create department during setup
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['PRINCIPAL'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate input
    const validationResult = setupDepartmentSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { name, code } = validationResult.data

    // Check if department code already exists
    const existingDept = await prisma.department.findUnique({
      where: { code }
    })

    if (existingDept) {
      return NextResponse.json(
        { error: 'Department with this code already exists' },
        { status: 409 }
      )
    }

    // Create department
    const department = await prisma.department.create({
      data: {
        name,
        code,
      },
    })

    return NextResponse.json(department, { status: 201 })
  } catch (error) {
    console.error('Setup department error:', error)
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 })
  }
}
