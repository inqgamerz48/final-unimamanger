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
    
    const faculty = await prisma.user.findMany({
      where: { role: 'FACULTY' },
      select: { id: true, fullName: true, email: true }
    })
    return NextResponse.json(faculty)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch faculty' }, { status: 500 })
  }
}
