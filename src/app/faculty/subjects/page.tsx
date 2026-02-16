'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, BookOpen } from 'lucide-react'

interface Subject {
    id: string
    name: string
    code: string
    credits: number
    type: string
    batch: {
        name: string
        year: number
        semester: number
    }
}

export default function FacultySubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/faculty/subjects')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setSubjects(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">My Subjects</h1>
                    <p className="text-white/50 mt-1">Courses assigned to you</p>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 text-neon-lime animate-spin" />
                    </div>
                ) : subjects.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-lg">
                        <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <h3 className="text-xl text-white font-medium">No subjects assigned</h3>
                        <p className="text-white/50">Contact HOD for assignments.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {subjects.map(subject => (
                            <Card key={subject.id} className="bg-charcoal border-white/5 hover:border-neon-lime/30 transition-colors">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{subject.name}</h3>
                                            <p className="text-neon-lime font-mono text-xs">{subject.code}</p>
                                        </div>
                                        <Badge variant="outline">{subject.type}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div>
                                        <p className="text-white/40 text-xs uppercase">Batch</p>
                                        <p className="text-white font-medium">{subject.batch.name} (Sem {subject.batch.semester})</p>
                                    </div>
                                    <div>
                                        <p className="text-white/40 text-xs uppercase">Credits</p>
                                        <p className="text-white font-medium">{subject.credits}</p>
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
