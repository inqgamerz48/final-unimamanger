import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const firebaseUid = request.headers.get('x-firebase-uid')
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      include: { department: true }
    })

    if (!user || user.role !== 'HOD') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const departmentId = user.departmentId

    if (!departmentId) {
      return NextResponse.json({ error: 'HOD not assigned to any department' }, { status: 400 })
    }

    const [totalStudents, totalFaculty, totalSubjects, totalBatches] = await Promise.all([
      prisma.user.count({ 
        where: { role: 'STUDENT', departmentId } 
      }),
      prisma.user.count({ 
        where: { role: 'FACULTY', departmentId } 
      }),
      prisma.subject.count({ where: { departmentId } }),
      prisma.batch.count({ where: { departmentId } }),
    ])

    return NextResponse.json({
      totalStudents,
      totalFaculty,
      totalSubjects,
      totalBatches,
    })
  } catch (error: any) {
    console.error('HOD stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
