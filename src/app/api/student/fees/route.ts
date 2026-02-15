import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const firebaseUid = request.headers.get('x-firebase-uid')
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { firebaseUid } })

    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const fees = await prisma.fee.findMany({
      where: { studentId: user.id },
      orderBy: { dueDate: 'desc' },
    })

    return NextResponse.json(fees)
  } catch (error: any) {
    console.error('Student fees error:', error)
    return NextResponse.json({ error: 'Failed to fetch fees' }, { status: 500 })
  }
}
