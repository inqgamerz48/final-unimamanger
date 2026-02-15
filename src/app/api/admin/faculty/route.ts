import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const firebaseUid = request.headers.get('x-firebase-uid')
    if (!firebaseUid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { firebaseUid } })
    if (!user || user.role !== 'PRINCIPAL') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    
    const faculty = await prisma.user.findMany({
      where: { role: 'FACULTY' },
      select: { id: true, fullName: true, email: true }
    })
    return NextResponse.json(faculty)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch faculty' }, { status: 500 })
  }
}
