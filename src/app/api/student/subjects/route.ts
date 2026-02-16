import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const authResult = await verifyRole(request, ['STUDENT'])
        if (!authResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { prismaUser: user } = authResult

        // Find student's active enrollment
        const enrollment = await prisma.enrollment.findFirst({
            where: { studentId: user.id },
            include: { batch: true },
            orderBy: { createdAt: 'desc' } // Get latest enrollment
        })

        if (!enrollment) {
            return NextResponse.json({ error: 'Not enrolled in any batch' }, { status: 404 })
        }

        const subjects = await prisma.subject.findMany({
            where: {
                batchId: enrollment.batchId
            },
            include: {
                faculty: { select: { fullName: true, email: true } },
                department: { select: { name: true, code: true } }
            },
            orderBy: {
                code: 'asc'
            }
        })

        return NextResponse.json(subjects)

    } catch (error) {
        console.error('Fetch student subjects error:', error)
        return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 })
    }
}
