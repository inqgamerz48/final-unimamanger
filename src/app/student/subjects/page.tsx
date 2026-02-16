'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Book, User, GraduationCap } from 'lucide-react'

interface Subject {
    id: string
    name: string
    code: string
    credits: number
    type: string
    electiveGroupId?: string
    faculty?: {
        fullName: string
        email: string
    }
}

export default function StudentSubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/student/subjects')
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

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'CORE': return <Badge className="bg-neon-lime text-obsidian">Core</Badge>
            case 'ELECTIVE': return <Badge variant="secondary">Elective</Badge>
            case 'LAB': return <Badge variant="outline">Lab</Badge>
            default: return <Badge variant="outline">{type}</Badge>
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">My Subjects</h1>
                    <p className="text-white/50 mt-1">Courses enrolled for this semester</p>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 text-neon-lime animate-spin" />
                    </div>
                ) : subjects.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-lg">
                        <Book className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <h3 className="text-xl text-white font-medium">No subjects found</h3>
                        <p className="text-white/50">You are not enrolled in any subjects yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {subjects.map(subject => (
                            <Card key={subject.id} className="bg-charcoal border-white/5 hover:border-neon-lime/30 transition-colors group">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-neon-lime transition-colors">{subject.name}</h3>
                                            <p className="text-white/50 font-mono text-xs">{subject.code}</p>
                                        </div>
                                        {getTypeBadge(subject.type)}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="space-y-1">
                                            <p className="text-white/40 text-xs uppercase">Credits</p>
                                            <p className="text-white font-medium flex items-center gap-2">
                                                <GraduationCap className="w-4 h-4 text-neon-lime" />
                                                {subject.credits}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-white/40 text-xs uppercase">Faculty</p>
                                            <p className="text-white font-medium flex items-center gap-2 truncate" title={subject.faculty?.fullName}>
                                                <User className="w-4 h-4 text-neon-lime" />
                                                {subject.faculty?.fullName || 'TBA'}
                                            </p>
                                        </div>
                                    </div>
                                    {subject.type === 'ELECTIVE' && subject.electiveGroupId && (
                                        <div className="bg-white/5 p-2 rounded text-xs text-white/70">
                                            Elective Group: {subject.electiveGroupId}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
