"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'

export default function HODCourses() {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && user && user.role !== 'HOD') {
            router.push('/')
        }
    }, [user, loading, router])

    if (loading || user?.role !== 'HOD') {
        return null
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Courses</h1>
                    <p className="text-white/50 mt-1">Manage department subjects and courses</p>
                </div>

                <Card className="bg-charcoal border-white/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <BookOpen className="h-5 w-5 text-neon-lime" />
                            Course List
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center p-8 border border-dashed border-white/10 rounded-lg">
                            <p className="text-white/50">Course management module coming soon.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
