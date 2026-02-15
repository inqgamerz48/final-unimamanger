import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const firebaseUid = request.headers.get('x-firebase-uid')
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { firebaseUid } })

    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const fee = await prisma.fee.findUnique({
      where: { id: params.id }
    })

    if (!fee || fee.studentId !== user.id) {
      return NextResponse.json({ error: 'Fee not found' }, { status: 404 })
    }

    if (fee.status === 'PAID') {
      return NextResponse.json({ error: 'Already paid' }, { status: 400 })
    }

    const updatedFee = await prisma.fee.update({
      where: { id: params.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      }
    })

    return NextResponse.json(updatedFee)
  } catch (error: any) {
    console.error('Pay fee error:', error)
    return NextResponse.json({ error: 'Failed to pay fee' }, { status: 500 })
  }
}
