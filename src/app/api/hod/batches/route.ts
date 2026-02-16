import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// GET - List batches in HOD's department (for filters)
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['HOD'])
    
    if (!authResult) {
      return NextResponse.json({ error: 'Forbidden - HOD access required' }, { status: 403 })
    }

    const { prismaUser: user } = authResult
    const departmentId = user.departmentId

    if (!departmentId) {
      return NextResponse.json({ error: 'HOD not assigned to any department' }, { status: 400 })
    }

    const batches = await prisma.batch.findMany({
      where: {
        departmentId: departmentId,
      },
      orderBy: [
        { year: 'desc' },
        { semester: 'asc' },
      ],
    })

    return NextResponse.json(batches)
  } catch (error) {
    console.error('HOD batches fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 })
  }
}
