import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['PRINCIPAL'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const departments = await prisma.department.findMany({
      include: {
        hod: { select: { fullName: true } },
        _count: {
          select: { users: true, batches: true }
        }
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(departments)
  } catch (error: any) {
    console.error('Admin departments GET error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch departments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['PRINCIPAL'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, code } = body

    const department = await prisma.department.create({
      data: { name, code }
    })

    return NextResponse.json(department)
  } catch (error: any) {
    console.error('Create department error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Department code already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message || 'Failed to create department' }, { status: 500 })
  }
}
