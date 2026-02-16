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
    const { name, code, batchId, facultyId } = body

    const updated = await prisma.subject.update({
      where: { id: params.id },
      data: { name, code, batchId, facultyId }
    })
    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Update subject error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Subject code already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyRole(request, ['PRINCIPAL', 'HOD'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await prisma.subject.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 })
  }
}
