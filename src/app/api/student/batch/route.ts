import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const authResult = await verifyRole(request, ['STUDENT'])

        if (!authResult) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { prismaUser: user } = authResult

        // Find latest active enrollment for the student
        const enrollment = await prisma.enrollment.findFirst({
            where: { studentId: user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                batch: {
                    select: {
                        id: true,
                        name: true,
                        year: true,
                        semester: true,
                        department: {
                            select: { name: true }
                        }
                    }
                }
            }
        })

        if (!enrollment) {
            return NextResponse.json({ message: 'No active batch enrollment found' }, { status: 404 })
        }

        return NextResponse.json(enrollment.batch)
    } catch (error) {
        console.error('Student batch error:', error)
        return NextResponse.json({ error: 'Failed to fetch batch details' }, { status: 500 })
    }
}
