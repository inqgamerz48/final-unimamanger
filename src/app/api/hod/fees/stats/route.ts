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

    // Get statistics (without amountPaid since column doesn't exist yet)
    const [
      totalFees,
      pendingFees,
      paidFees,
      overdueFees,
      totalAmountAgg,
    ] = await Promise.all([
      prisma.fee.count({ where }),
      prisma.fee.count({ where: { ...where, status: 'PENDING' } }),
      prisma.fee.count({ where: { ...where, status: 'PAID' } }),
      prisma.fee.count({ where: { ...where, status: 'OVERDUE' } }),
      prisma.fee.aggregate({
        where,
        _sum: { amount: true }
      }),
    ])

    const totalAmount = totalAmountAgg._sum.amount || 0
    // Calculate collected as just the count of paid fees * average amount (simplified)
    const paidAmountAgg = await prisma.fee.aggregate({
      where: { ...where, status: 'PAID' },
      _sum: { amount: true },
      _count: { id: true },
    })
    
    const collectedAmount = paidAmountAgg._sum.amount || 0

    return NextResponse.json({
      overview: {
        totalFees,
        pendingFees,
        paidFees,
        partiallyPaidFees: 0, // Not tracked without amountPaid column
        overdueFees,
        totalAmount,
        collectedAmount,
        collectionRate: totalAmount > 0 
          ? ((collectedAmount / totalAmount) * 100).toFixed(2)
          : 0,
      },
    })
  } catch (error) {
    console.error('HOD fee stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch fee statistics' }, { status: 500 })
  }
}
