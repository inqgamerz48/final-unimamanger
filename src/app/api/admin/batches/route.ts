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
    const batches = await prisma.batch.findMany({
      include: {
        department: { select: { name: true, code: true } },
        _count: { select: { enrollments: true } }
      },
      orderBy: [{ year: 'desc' }, { semester: 'desc' }],
    })
    return NextResponse.json(batches)
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['PRINCIPAL'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const { name, year, semester, departmentId } = body

    if (!name || !departmentId || !year || !semester) {
      return NextResponse.json({ error: 'Name, Department, Year and Semester are required' }, { status: 400 })
    }

    const batch = await prisma.batch.create({
      data: { name, year, semester, departmentId }
    })
    return NextResponse.json(batch)
  } catch (error: any) {
    console.error('Batch creation error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A batch with this department, year, and semester already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create batch' },
      { status: 500 }
    )
  }
}
