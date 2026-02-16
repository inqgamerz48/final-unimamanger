"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default function HODReports() {
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
                    <h1 className="text-3xl font-bold text-white">Reports</h1>
                    <p className="text-white/50 mt-1">View department reports</p>
                </div>

                <Card className="bg-charcoal border-white/5">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-neon-lime" />
                            <CardTitle className="text-white">Reports Dashboard</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12 text-white/50 border border-dashed border-white/10 rounded-lg">
                            Reports module coming soon.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
