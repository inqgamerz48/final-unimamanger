import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// GET - Check setup status
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['PRINCIPAL'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    // Check college settings
    const collegeSettings = await prisma.collegeSettings.findUnique({
      where: { id: 'default' }
    })

    // Check if departments exist
    const departmentCount = await prisma.department.count()

    // Determine setup steps completed
    const setupStatus = {
      isComplete: collegeSettings?.isSetupComplete || false,
      steps: {
        collegeDetails: !!collegeSettings && collegeSettings.collegeName !== 'My College',
        department: departmentCount > 0,
        hod: false, // Will check in next step
        faculty: false, // Will check in next step
        students: false, // Will check in next step
      }
    }

    // Check HOD exists
    if (departmentCount > 0) {
      const hodCount = await prisma.user.count({ where: { role: 'HOD' } })
      setupStatus.steps.hod = hodCount > 0
    }

    // Check faculty exists
    if (setupStatus.steps.hod) {
      const facultyCount = await prisma.user.count({ where: { role: 'FACULTY' } })
      setupStatus.steps.faculty = facultyCount > 0
    }

    // Check students exist
    if (setupStatus.steps.faculty) {
      const studentCount = await prisma.user.count({ where: { role: 'STUDENT' } })
      setupStatus.steps.students = studentCount > 0
    }

    return NextResponse.json(setupStatus)
  } catch (error) {
    console.error('Setup status error:', error)
    return NextResponse.json({ error: 'Failed to fetch setup status' }, { status: 500 })
  }
}
