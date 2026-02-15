import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// GET - Fee statistics
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyRole(request, ['PRINCIPAL'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const academicYear = searchParams.get('academicYear')

    // Build where clause
    const where: any = {}
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
      waivedFees,
      totalAmount,
      collectedAmount,
      pendingAmount,
    ] = await Promise.all([
      prisma.fee.count({ where }),
      prisma.fee.count({ where: { ...where, status: 'PENDING' } }),
      prisma.fee.count({ where: { ...where, status: 'PAID' } }),
      prisma.fee.count({ where: { ...where, status: 'PARTIALLY_PAID' } }),
      prisma.fee.count({ where: { ...where, status: 'OVERDUE' } }),
      prisma.fee.count({ where: { ...where, status: 'WAIVED' } }),
      prisma.fee.aggregate({
        where,
        _sum: { amount: true }
      }),
      prisma.fee.aggregate({
        where: { ...where, OR: [{ status: 'PAID' }, { status: 'PARTIALLY_PAID' }] },
        _sum: { amountPaid: true }
      }),
      prisma.fee.aggregate({
        where: { ...where, OR: [{ status: 'PENDING' }, { status: 'OVERDUE' }] },
        _sum: { amount: true }
      }),
    ])

    // Get fee type breakdown
    const feeTypeBreakdown = await prisma.fee.groupBy({
      by: ['feeType'],
      where,
      _count: { id: true },
      _sum: { amount: true, amountPaid: true }
    })

    // Get monthly collection data
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyData = await prisma.fee.groupBy({
      by: ['paidAt'],
      where: {
        ...where,
        paidAt: { gte: sixMonthsAgo },
        OR: [{ status: 'PAID' }, { status: 'PARTIALLY_PAID' }]
      },
      _sum: { amountPaid: true }
    })

    return NextResponse.json({
      overview: {
        totalFees,
        pendingFees,
        paidFees,
        partiallyPaidFees,
        overdueFees,
        waivedFees,
        totalAmount: totalAmount._sum.amount || 0,
        collectedAmount: collectedAmount._sum.amountPaid || 0,
        pendingAmount: pendingAmount._sum.amount || 0,
        collectionRate: totalAmount._sum.amount 
          ? ((collectedAmount._sum.amountPaid || 0) / totalAmount._sum.amount * 100).toFixed(2)
          : 0,
      },
      feeTypeBreakdown,
      monthlyData,
    })
  } catch (error) {
    console.error('Fee stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch fee statistics' }, { status: 500 })
  }
}
