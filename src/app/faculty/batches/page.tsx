"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { getAuthHeaders } from '@/lib/api-helpers'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Users } from 'lucide-react'

interface Batch {
    id: string
    name: string
    year: number
    semester: number
}

export default function FacultyBatches() {
    const { user, firebaseUser } = useAuth()
    const [batches, setBatches] = useState<Batch[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchBatches = async () => {
            if (!user) return

            try {
                const headers = await getAuthHeaders(firebaseUser)
                const res = await fetch('/api/faculty/batches', { headers })

                if (res.ok) {
                    const data = await res.json()
                    setBatches(data)
                }
            } catch (error) {
                console.error('Error fetching batches:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchBatches()
    }, [user, firebaseUser])

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-white">My Department Batches</h1>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-neon-lime border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : batches.length === 0 ? (
                    <div className="text-center py-12 text-white/50">No batches found for your department</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {batches.map((batch) => (
                            <Card key={batch.id} className="bg-charcoal border-white/5">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-10 w-10 rounded-lg bg-neon-lime/10 flex items-center justify-center">
                                            <Users className="h-5 w-5 text-neon-lime" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">{batch.name}</h3>
                                            <p className="text-white/50 text-sm">Year {batch.year} - Sem {batch.semester}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
