import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const authResult = await verifyRole(request, ['FACULTY'])

        if (!authResult) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { prismaUser: user } = authResult

        if (!user.departmentId) {
            return NextResponse.json({ error: 'Faculty not assigned to department' }, { status: 400 })
        }

        // Fetch batches for the faculty's department
        const batches = await prisma.batch.findMany({
            where: { departmentId: user.departmentId },
            select: {
                id: true,
                name: true,
                year: true,
                semester: true,
            },
            orderBy: [
                { year: 'desc' },
                { semester: 'asc' }
            ]
        })

        return NextResponse.json(batches)
    } catch (error) {
        console.error('Faculty batches error:', error)
        return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 })
    }
}
