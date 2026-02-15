import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify PRINCIPAL role
    const authResult = await verifyRole(request, ['PRINCIPAL'])
    
    if (!authResult) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const [totalStudents, totalFaculty, totalDepartments, totalSubjects] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: { in: ['FACULTY', 'HOD'] } } }),
      prisma.department.count(),
      prisma.subject.count(),
    ])

    return NextResponse.json({
      totalStudents,
      totalFaculty,
      totalDepartments,
      totalSubjects,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
