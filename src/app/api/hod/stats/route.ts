import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify HOD role and get user data
    const authResult = await verifyRole(request, ['HOD'])
    
    if (!authResult) {
      return NextResponse.json({ error: 'Forbidden - HOD access required' }, { status: 403 })
    }

    const { prismaUser: user } = authResult
    const departmentId = user.departmentId

    if (!departmentId) {
      return NextResponse.json({ error: 'HOD not assigned to any department' }, { status: 400 })
    }

    // Fetch department-scoped statistics
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
      departmentName: user.department?.name || 'Department',
    })
  } catch (error) {
    console.error('HOD stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
