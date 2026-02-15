import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const firebaseUid = request.headers.get('x-firebase-uid')
    if (!firebaseUid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { firebaseUid } })
    if (!user || user.role !== 'PRINCIPAL') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    
    const subjects = await prisma.subject.findMany({
      include: {
        department: { select: { name: true } },
        batch: { select: { name: true } },
        faculty: { select: { fullName: true } }
      },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(subjects)
  } catch (error: any) {
    console.error('Admin subjects GET error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch subjects' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const firebaseUid = request.headers.get('x-firebase-uid')
    if (!firebaseUid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { firebaseUid } })
    if (!user || user.role !== 'PRINCIPAL') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    
    const body = await request.json()
    const { name, code, departmentId, batchId, facultyId } = body
    
    const subject = await prisma.subject.create({
      data: { name, code, departmentId, batchId, facultyId }
    })
    return NextResponse.json(subject)
  } catch (error: any) {
    console.error('Create subject error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Subject code already exists' }, { status: 409 })
    }
    if (error.code === 'P2003') {
      return NextResponse.json({ error: 'Invalid department, batch, or faculty ID' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || 'Failed to create subject' }, { status: 500 })
  }
}
