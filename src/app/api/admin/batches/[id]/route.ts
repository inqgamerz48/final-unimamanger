import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'


export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyRole(request, ['PRINCIPAL', 'HOD'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, year, semester, departmentId } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const updatedBatch = await prisma.batch.update({
      where: { id: params.id },
      data: { name, year, semester, departmentId }
    })

    return NextResponse.json(updatedBatch)
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update batch' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyRole(request, ['PRINCIPAL', 'HOD'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await prisma.batch.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete batch' }, { status: 500 })
  }
}
