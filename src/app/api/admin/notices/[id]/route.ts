import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyRole(request, ['PRINCIPAL', 'HOD'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.notice.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete notice error:', error)
    return NextResponse.json({ error: 'Failed to delete notice' }, { status: 500 })
  }
}
