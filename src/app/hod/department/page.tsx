"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2 } from 'lucide-react'

export default function HODDepartment() {
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
                    <h1 className="text-3xl font-bold text-white">My Department</h1>
                    <p className="text-white/50 mt-1">Manage department details</p>
                </div>

                <Card className="bg-charcoal border-white/5">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-neon-lime/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-neon-lime" />
                            </div>
                            <CardTitle className="text-white">Department Information</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                                <p className="text-sm text-white/50 mb-1">Department Name</p>
                                <p className="text-lg font-medium text-white">{user.department?.name || 'Not assigned'}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                                <p className="text-sm text-white/50 mb-1">Department Code</p>
                                <p className="text-lg font-medium text-white">{user.department?.code || 'N/A'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
