import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const firebaseUid = request.headers.get('x-firebase-uid')
    if (!firebaseUid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { firebaseUid } })
    if (!user || user.role !== 'PRINCIPAL') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await prisma.subject.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 })
  }
}
