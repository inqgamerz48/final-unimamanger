'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2, ShieldCheck, UserPlus, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface Department {
    id: string
    name: string
    code: string
    examCellCoordinatorId?: string
    examCellCoordinator?: {
        id: string
        fullName: string
        email: string
    }
}

interface Faculty {
    id: string
    fullName: string
    departmentId: string
}

export default function ExamCellPage() {
    const [departments, setDepartments] = useState<Department[]>([])
    const [faculty, setFaculty] = useState<Faculty[]>([])
    const [loading, setLoading] = useState(true)
    const [assigning, setAssigning] = useState<string | null>(null) // departmentId

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [deptRes, facultyRes] = await Promise.all([
                fetch('/api/admin/departments'),
                fetch('/api/admin/users?role=FACULTY')
            ])

            if (deptRes.ok && facultyRes.ok) {
                setDepartments(await deptRes.json())
                setFaculty(await facultyRes.json())
            }
        } catch (error) {
            console.error(error)
            toast.error('Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    const handleAssign = async (departmentId: string, userId: string) => {
        setAssigning(departmentId)
        try {
            // We need an API to update Department coordinator
            // Ideally: PUT /api/admin/departments/[id] with { examCellCoordinatorId: userId }
            // Or a specific endpoint. Let's use the generic department update if available or create one.
            // Assuming we can update department details.

            const res = await fetch(`/api/admin/departments/${departmentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ examCellCoordinatorId: userId })
            })

            if (res.ok) {
                toast.success('Coordinator assigned')
                fetchData()
            } else {
                toast.error('Failed to assign coordinator')
            }
        } catch (error) {
            console.error(error)
            toast.error('Error assigning coordinator')
        } finally {
            setAssigning(null)
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Exam Cell Management</h1>
                    <p className="text-white/50 mt-1">Assign Exam Cell Coordinators for each department.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 text-neon-lime animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {departments.map(dept => (
                            <Card key={dept.id} className="bg-charcoal border-white/5">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-white flex justify-between items-center">
                                        {dept.name}
                                        <span className="text-xs font-mono text-white/40 bg-white/5 px-2 py-1 rounded">{dept.code}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="p-4 rounded-lg bg-black/20 border border-white/5">
                                        <Label className="text-xs uppercase text-white/40 mb-2 block">Current Coordinator</Label>
                                        {dept.examCellCoordinator ? (
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 bg-neon-lime/10 text-neon-lime border border-neon-lime/20">
                                                    <AvatarFallback>{dept.examCellCoordinator.fullName[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{dept.examCellCoordinator.fullName}</p>
                                                    <p className="text-xs text-white/40">{dept.examCellCoordinator.email}</p>
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="ml-auto h-8 w-8 text-white/30 hover:text-red-500"
                                                    onClick={() => handleAssign(dept.id, '')} // Unassign
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-white/30 text-sm italic">
                                                <ShieldCheck className="w-4 h-4" />
                                                No coordinator assigned
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs text-white/60">Assign New Coordinator</Label>
                                        <Select
                                            onValueChange={(val) => handleAssign(dept.id, val)}
                                            disabled={assigning === dept.id}
                                        >
                                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                <SelectValue placeholder="Select Faculty" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {faculty
                                                    .filter(f => f.departmentId === dept.id) // Only faculty from same dept? optionally
                                                    .map(f => (
                                                        <SelectItem key={f.id} value={f.id}>{f.fullName}</SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
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
