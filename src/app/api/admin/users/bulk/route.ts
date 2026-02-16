import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRole } from '@/lib/auth-verification'
import { auth } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const authResult = await verifyRole(request, ['ADMIN'])
        if (!authResult) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { users, defaultPassword } = await request.json()

        if (!Array.isArray(users) || users.length === 0) {
            return NextResponse.json({ error: 'Users array is required' }, { status: 400 })
        }

        if (!defaultPassword || defaultPassword.length < 6) {
            return NextResponse.json({ error: 'Default password (min 6 chars) is required' }, { status: 400 })
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        }

        // Process sequentially to avoid race conditions or overwhelming APIs
        for (const user of users) {
            const { email, fullName, role, department, batch, studentId, phone } = user
            let firebaseUid = ''

            try {
                if (!email || !fullName || !role) {
                    throw new Error(`Missing required fields for ${email || 'unknown user'}`)
                }

                const validRole = role.toUpperCase()
                if (!['STUDENT', 'FACULTY', 'HOD', 'ADMIN'].includes(validRole)) {
                    throw new Error(`Invalid role: ${role} for ${email}`)
                }

                // 2. Resolve Department ID
                let departmentId = null
                if (department) {
                    const dept = await prisma.department.findFirst({
                        where: { name: { equals: department, mode: 'insensitive' } }
                    })
                    if (dept) departmentId = dept.id
                }

                // 3. Create in Firebase
                try {
                    const userRecord = await auth.createUser({
                        email,
                        password: defaultPassword,
                        displayName: fullName,
                        phoneNumber: phone || undefined
                    })
                    firebaseUid = userRecord.uid
                } catch (firebaseError: any) {
                    if (firebaseError.code === 'auth/email-already-exists') {
                        throw new Error(`User ${email} already exists in authentication system`)
                    }
                    throw firebaseError
                }

                // 4. Create in Postgres
                try {
                    const newUser = await prisma.user.create({
                        data: {
                            email,
                            fullName,
                            role: validRole as any,
                            firebaseUid,
                            departmentId,
                            studentId: studentId || null,
                        }
                    })

                    // 5. Handle Student Enrollment
                    if (validRole === 'STUDENT' && batch) {
                        if (departmentId) {
                            const batchRec = await prisma.batch.findFirst({
                                where: {
                                    departmentId,
                                    name: { equals: batch, mode: 'insensitive' }
                                }
                            })

                            if (batchRec) {
                                await prisma.enrollment.create({
                                    data: {
                                        studentId: newUser.id,
                                        batchId: batchRec.id,
                                        academicYear: '2024-2025' // Default
                                    }
                                })
                            } else {
                                results.errors.push(`Created user ${email} but failed to find batch: ${batch}`)
                            }
                        }
                    }

                    results.success++

                } catch (dbError: any) {
                    // Rollback Firebase creation
                    if (firebaseUid) await auth.deleteUser(firebaseUid)
                    throw new Error(`Database creation failed: ${dbError.message}`)
                }

            } catch (error: any) {
                results.failed++
                results.errors.push(`Row ${users.indexOf(user) + 1} (${email}): ${error.message}`)
            }
        }

        return NextResponse.json(results)

    } catch (error) {
        console.error('Bulk create error:', error)
        return NextResponse.json({ error: 'Bulk create failed' }, { status: 500 })
    }
}
