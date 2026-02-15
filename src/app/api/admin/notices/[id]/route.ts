import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const firebaseUid = request.headers.get('x-firebase-uid')
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { firebaseUid } })

    if (!user || (user.role !== 'PRINCIPAL' && user.role !== 'HOD')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.notice.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete notice error:', error)
    return NextResponse.json({ error: 'Failed to delete notice' }, { status: 500 })
  }
}
