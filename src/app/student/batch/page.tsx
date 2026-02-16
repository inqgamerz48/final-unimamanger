"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { getAuthHeaders } from '@/lib/api-helpers'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Users, Building2 } from 'lucide-react'

interface Batch {
    id: string
    name: string
    year: number
    semester: number
    department: { name: string }
}

export default function StudentBatch() {
    const { user, firebaseUser } = useAuth()
    const [batch, setBatch] = useState<Batch | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchBatch = async () => {
            if (!user) return

            try {
                const headers = await getAuthHeaders(firebaseUser)
                const res = await fetch('/api/student/batch', { headers })

                if (res.ok) {
                    const data = await res.json()
                    setBatch(data)
                } else if (res.status === 404) {
                    setError('You are not currently enrolled in any batch.')
                } else {
                    setError('Failed to load batch details.')
                }
            } catch (error) {
                console.error('Error fetching batch:', error)
                setError('An error occurred while loading batch details.')
            } finally {
                setLoading(false)
            }
        }

        fetchBatch()
    }, [user, firebaseUser])

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-white">My Batch</h1>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-neon-lime border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : error ? (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg">
                        {error}
                    </div>
                ) : batch ? (
                    <Card className="bg-charcoal border-white/5">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Users className="w-6 h-6 text-neon-lime" />
                                {batch.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
                                    <div className="h-10 w-10 rounded-lg bg-neon-lime/10 flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-neon-lime" />
                                    </div>
                                    <div>
                                        <h3 className="text-white/50 text-sm">Academic Year</h3>
                                        <p className="text-white font-medium">{batch.year}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
                                    <div className="h-10 w-10 rounded-lg bg-neon-lime/10 flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-neon-lime" />
                                    </div>
                                    <div>
                                        <h3 className="text-white/50 text-sm">Semester</h3>
                                        <p className="text-white font-medium">{batch.semester}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg col-span-full">
                                    <div className="h-10 w-10 rounded-lg bg-neon-lime/10 flex items-center justify-center">
                                        <Building2 className="h-5 w-5 text-neon-lime" />
                                    </div>
                                    <div>
                                        <h3 className="text-white/50 text-sm">Department</h3>
                                        <p className="text-white font-medium">{batch.department.name}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : null}
            </div>
        </DashboardLayout>
    )
}
