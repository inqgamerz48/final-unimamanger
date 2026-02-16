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
    const batch = await prisma.batch.create({
      data: { name, year, semester, departmentId }
    })
    return NextResponse.json(batch)
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 })
  }
}
