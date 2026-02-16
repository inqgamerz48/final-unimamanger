import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['STUDENT'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prismaUser: user } = authResult

    const complaints = await prisma.complaint.findMany({
      where: { studentId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(complaints)
  } catch (error: any) {
    console.error('Student complaints error:', error)
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['STUDENT'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prismaUser: user } = authResult
    const body = await request.json()
    const { title, description } = body

    const complaint = await prisma.complaint.create({
      data: {
        title,
        description,
        studentId: user.id,
      }
    })

    return NextResponse.json(complaint)
  } catch (error: any) {
    console.error('Create complaint error:', error)
    return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 })
  }
}
