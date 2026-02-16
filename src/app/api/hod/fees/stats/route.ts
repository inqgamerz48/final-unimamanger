import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// GET - Department fee statistics for HOD
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['HOD'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized - HOD access required' }, { status: 401 })
    }

    const { prismaUser } = authResult
    const departmentId = prismaUser.departmentId

    if (!departmentId) {
      return NextResponse.json({ error: 'HOD not assigned to any department' }, { status: 400 })
    }
    const { searchParams } = new URL(request.url)
    const academicYear = searchParams.get('academicYear')

    // Build where clause
    const where: any = {
      student: {
        departmentId,
        role: 'STUDENT'
      }
    }
    
    if (academicYear) {
      where.academicYear = academicYear
    }

    // Get statistics
    const [
      totalFees,
      pendingFees,
      paidFees,
      partiallyPaidFees,
      overdueFees,
      totalAmount,
      collectedAmount,
    ] = await Promise.all([
      prisma.fee.count({ where }),
      prisma.fee.count({ where: { ...where, status: 'PENDING' } }),
      prisma.fee.count({ where: { ...where, status: 'PAID' } }),
      prisma.fee.count({ where: { ...where, status: 'PARTIALLY_PAID' } }),
      prisma.fee.count({ where: { ...where, status: 'OVERDUE' } }),
      prisma.fee.aggregate({
        where,
        _sum: { amount: true }
      }),
      prisma.fee.aggregate({
        where: { ...where, OR: [{ status: 'PAID' }, { status: 'PARTIALLY_PAID' }] },
        _sum: { amountPaid: true }
      }),
    ])

    // Get fee type breakdown
    const feeTypeBreakdown = await prisma.fee.groupBy({
      by: ['feeType'],
      where,
      _count: { id: true },
      _sum: { amount: true, amountPaid: true }
    })

    // Get batch-wise breakdown
    const batchStats = await prisma.batch.findMany({
      where: { departmentId },
      include: {
        enrollments: {
          include: {
            student: {
              include: {
                fees: {
                  where: academicYear ? { academicYear } : undefined
                }
              }
            }
          }
        }
      }
    })

    const batchBreakdown = batchStats.map(batch => {
      const allFees = batch.enrollments.flatMap(e => e.student.fees)
      const totalBatchAmount = allFees.reduce((sum, f) => sum + f.amount, 0)
      const collectedBatchAmount = allFees.reduce((sum, f) => sum + f.amountPaid, 0)
      
      return {
        batchId: batch.id,
        batchName: batch.name,
        year: batch.year,
        semester: batch.semester,
        totalStudents: batch.enrollments.length,
        totalFees: allFees.length,
        totalAmount: totalBatchAmount,
        collectedAmount: collectedBatchAmount,
        collectionRate: totalBatchAmount > 0 ? ((collectedBatchAmount / totalBatchAmount) * 100).toFixed(2) : 0,
      }
    })

    return NextResponse.json({
      overview: {
        totalFees,
        pendingFees,
        paidFees,
        partiallyPaidFees,
        overdueFees,
        totalAmount: totalAmount._sum.amount || 0,
        collectedAmount: collectedAmount._sum.amountPaid || 0,
        collectionRate: totalAmount._sum.amount 
          ? ((collectedAmount._sum.amountPaid || 0) / totalAmount._sum.amount * 100).toFixed(2)
          : 0,
      },
      feeTypeBreakdown,
      batchBreakdown,
    })
  } catch (error) {
    console.error('HOD fee stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch fee statistics' }, { status: 500 })
  }
}
