import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const authResult = await verifyRole(request, ['FACULTY', 'HOD', 'PRINCIPAL'])
        if (!authResult) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const batchId = searchParams.get('batchId')

        if (!batchId) {
            return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 })
        }

        // Fetch students enrolled in the batch
        // We navigate through Enrollment -> User
        const enrollments = await prisma.enrollment.findMany({
            where: { batchId },
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        studentId: true, // Custom ID like 24UNI-CSE-001
                        // rollNumber might not exist in schema based on previous checks, stick to studentId
                    }
                }
            },
            orderBy: {
                student: { fullName: 'asc' }
            }
        })

        const students = enrollments.map(e => ({
            ...e.student,
            enrollmentId: e.id
        }))

        return NextResponse.json(students)

    } catch (error) {
        console.error('Fetch specific batch students error:', error)
        return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }
}
