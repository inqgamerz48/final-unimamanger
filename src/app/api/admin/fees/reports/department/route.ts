import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// GET - Department-wise fee report
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['PRINCIPAL'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const academicYear = searchParams.get('academicYear') || '2024-2025'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get all departments with their fee data
    const departments = await prisma.department.findMany({
      include: {
        users: {
          where: { role: 'STUDENT' },
          include: {
            fees: {
              where: {
                academicYear,
                ...(startDate && { dueDate: { gte: new Date(startDate) } }),
                ...(endDate && { dueDate: { lte: new Date(endDate) } }),
              }
            }
          }
        }
      }
    })

    // Calculate department-wise statistics
    const departmentReports = departments.map(dept => {
      const students = dept.users
      const allFees = students.flatMap(s => s.fees)

      const totalStudents = students.length
      const totalFees = allFees.length
      const totalAmount = allFees.reduce((sum, fee) => sum + fee.amount, 0)
      const collectedAmount = allFees.reduce((sum, fee) => sum + fee.amountPaid, 0)
      const pendingAmount = allFees
        .filter(f => f.status === 'PENDING' || f.status === 'OVERDUE')
        .reduce((sum, fee) => sum + (fee.amount - fee.amountPaid), 0)
      
      const paidFees = allFees.filter(f => f.status === 'PAID').length
      const pendingFees = allFees.filter(f => f.status === 'PENDING').length
      const overdueFees = allFees.filter(f => f.status === 'OVERDUE').length
      const partiallyPaidFees = allFees.filter(f => f.status === 'PARTIALLY_PAID').length

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        departmentCode: dept.code,
        totalStudents,
        totalFees,
        totalAmount,
        collectedAmount,
        pendingAmount,
        collectionRate: totalAmount > 0 ? ((collectedAmount / totalAmount) * 100).toFixed(2) : 0,
        paidFees,
        pendingFees,
        overdueFees,
        partiallyPaidFees,
      }
    })

    // Sort by collection rate
    departmentReports.sort((a, b) => parseFloat(b.collectionRate as string) - parseFloat(a.collectionRate as string))

    return NextResponse.json({
      academicYear,
      startDate,
      endDate,
      departments: departmentReports,
      summary: {
        totalDepartments: departmentReports.length,
        totalStudents: departmentReports.reduce((sum, d) => sum + d.totalStudents, 0),
        totalAmount: departmentReports.reduce((sum, d) => sum + d.totalAmount, 0),
        totalCollected: departmentReports.reduce((sum, d) => sum + d.collectedAmount, 0),
        totalPending: departmentReports.reduce((sum, d) => sum + d.pendingAmount, 0),
      }
    })
  } catch (error) {
    console.error('Department report error:', error)
    return NextResponse.json({ error: 'Failed to generate department report' }, { status: 500 })
  }
}
