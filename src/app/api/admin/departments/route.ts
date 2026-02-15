import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const firebaseUid = request.headers.get('x-firebase-uid')
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { firebaseUid } })

    if (!user || user.role !== 'PRINCIPAL') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
    console.error('Admin departments error:', error)
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const firebaseUid = request.headers.get('x-firebase-uid')
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { firebaseUid } })

    if (!user || user.role !== 'PRINCIPAL') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, code } = body

    const department = await prisma.department.create({
      data: { name, code }
    })

    return NextResponse.json(department)
  } catch (error: any) {
    console.error('Create department error:', error)
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 })
  }
}
