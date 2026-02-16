'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { BookOpen, Plus, Search, Edit2, Trash2, X, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Subject {
    id: string
    name: string
    code: string
    credits: number
    type: 'CORE' | 'ELECTIVE' | 'LAB'
    electiveGroupId?: string
    batchId: string
    facultyId?: string
    batch: { name: string; year: number; semester: number }
    faculty?: { id: string; fullName: string }
}

interface Batch {
    id: string
    name: string
    year: number
    semester: number
}

interface Faculty {
    id: string
    fullName: string
    email: string
}

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [batches, setBatches] = useState<Batch[]>([])
    const [facultyList, setFacultyList] = useState<Faculty[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterBatch, setFilterBatch] = useState('all')

    // Modal states
    const [showModal, setShowModal] = useState(false)
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
    const [submitting, setSubmitting] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        credits: 3,
        type: 'CORE',
        electiveGroupId: '',
        batchId: '',
        facultyId: '',
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [subjectsRes, batchesRes, facultyRes] = await Promise.all([
                fetch('/api/hod/subjects'),
                fetch('/api/hod/batches'), // Ensure this endpoint exists and returns list
                fetch('/api/hod/faculty')  // Ensure this endpoint exists and returns list
            ])

            if (subjectsRes.ok) setSubjects(await subjectsRes.json())
            if (batchesRes.ok) setBatches(await batchesRes.json())
            if (facultyRes.ok) setFacultyList(await facultyRes.json())
        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error('Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            credits: 3,
            type: 'CORE',
            electiveGroupId: '',
            batchId: '',
            facultyId: '',
        })
        setEditingSubject(null)
    }

    const openCreateModal = () => {
        resetForm()
        setShowModal(true)
    }

    const openEditModal = (subject: Subject) => {
        setEditingSubject(subject)
        setFormData({
            name: subject.name,
            code: subject.code,
            credits: subject.credits,
            type: subject.type,
            electiveGroupId: subject.electiveGroupId || '',
            batchId: subject.batchId,
            facultyId: subject.facultyId || '',
        })
        setShowModal(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const url = editingSubject
                ? `/api/hod/subjects?id=${editingSubject.id}`
                : '/api/hod/subjects'

            const method = editingSubject ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    credits: Number(formData.credits), // Ensure number
                    facultyId: formData.facultyId || null,
                    electiveGroupId: formData.type === 'ELECTIVE' ? formData.electiveGroupId : null
                }),
            })

            if (res.ok) {
                toast.success(editingSubject ? 'Subject updated' : 'Subject created')
                setShowModal(false)
                fetchData()
            } else {
                const error = await res.json()
                toast.error(error.error || 'Operation failed')
            }
        } catch (error) {
            console.error('Submit error:', error)
            toast.error('Something went wrong')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this subject?')) return

        try {
            const res = await fetch(`/api/hod/subjects?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Subject deleted')
                fetchData()
            } else {
                const error = await res.json()
                toast.error(error.error || 'Failed to delete')
            }
        } catch (error) {
            console.error(error)
            toast.error('Delete failed')
        }
    }

    const filteredSubjects = subjects.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.code.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesBatch = filterBatch === 'all' || s.batchId === filterBatch
        return matchesSearch && matchesBatch
    })

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Subject Management</h1>
                        <p className="text-white/50 mt-1">Manage curriculum and assign faculty</p>
                    </div>
                    <Button onClick={openCreateModal} className="bg-neon-lime text-obsidian hover:bg-neon-lime/90">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Subject
                    </Button>
                </div>

                <div className="flex gap-4 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                        <Input
                            placeholder="Search subjects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-charcoal border-white/5 text-white"
                        />
                    </div>
                    <Select value={filterBatch} onValueChange={setFilterBatch}>
                        <SelectTrigger className="w-[200px] bg-charcoal border-white/5 text-white">
                            <SelectValue placeholder="Filter by Batch" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Batches</SelectItem>
                            {batches.map(b => (
                                <SelectItem key={b.id} value={b.id}>{b.name} (Sem {b.semester})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 text-neon-lime animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSubjects.map(subject => (
                            <Card key={subject.id} className="bg-charcoal border-white/5 hover:border-neon-lime/30 transition-colors">
                                <CardHeader className="flex flex-row items-start justify-between pb-2">
                                    <div>
                                        <CardTitle className="text-xl text-white">{subject.name}</CardTitle>
                                        <p className="text-neon-lime font-mono text-sm">{subject.code}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => openEditModal(subject)} className="h-8 w-8 text-white/50 hover:text-white">
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(subject.id)} className="h-8 w-8 text-white/50 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-white/40">Credits</p>
                                            <p className="text-white font-medium">{subject.credits}</p>
                                        </div>
                                        <div>
                                            <p className="text-white/40">Type</p>
                                            <p className="text-white font-medium">{subject.type}</p>
                                        </div>
                                        <div>
                                            <p className="text-white/40">Batch</p>
                                            <p className="text-white font-medium">{subject.batch.name} (S{subject.batch.semester})</p>
                                        </div>
                                        <div>
                                            <p className="text-white/40">Faculty</p>
                                            <p className="text-white font-medium truncate" title={subject.faculty?.fullName || 'Unassigned'}>
                                                {subject.faculty?.fullName || 'Unassigned'}
                                            </p>
                                        </div>
                                    </div>
                                    {subject.type === 'ELECTIVE' && subject.electiveGroupId && (
                                        <div className="bg-white/5 p-2 rounded text-xs text-white/70">
                                            Group: {subject.electiveGroupId}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <Dialog open={showModal} onOpenChange={setShowModal}>
                    <DialogContent className="bg-charcoal border-white/10 text-white max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Subject Name *</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Subject Code *</Label>
                                    <Input
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        required
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Credits *</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={formData.credits}
                                        onChange={e => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                                        required
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Type *</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={val => setFormData({ ...formData, type: val })}
                                    >
                                        <SelectTrigger className="bg-white/5 border-white/10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CORE">Core</SelectItem>
                                            <SelectItem value="ELECTIVE">Elective</SelectItem>
                                            <SelectItem value="LAB">Lab</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {formData.type === 'ELECTIVE' && (
                                <div className="space-y-2">
                                    <Label>Elective Group ID (Optional)</Label>
                                    <Input
                                        value={formData.electiveGroupId}
                                        onChange={e => setFormData({ ...formData, electiveGroupId: e.target.value })}
                                        placeholder="e.g. ELEC-A"
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Batch *</Label>
                                <Select
                                    value={formData.batchId}
                                    onValueChange={val => setFormData({ ...formData, batchId: val })}
                                    disabled={!!editingSubject} // Often batch shouldn't change easily as it affects relations
                                >
                                    <SelectTrigger className="bg-white/5 border-white/10">
                                        <SelectValue placeholder="Select Batch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {batches.map(b => (
                                            <SelectItem key={b.id} value={b.id}>{b.name} (Sem {b.semester})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Assigned Faculty</Label>
                                <Select
                                    value={formData.facultyId || 'none'}
                                    onValueChange={val => setFormData({ ...formData, facultyId: val === 'none' ? '' : val })}
                                >
                                    <SelectTrigger className="bg-white/5 border-white/10">
                                        <SelectValue placeholder="Select Faculty" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Unassigned</SelectItem>
                                        {facultyList.map(f => (
                                            <SelectItem key={f.id} value={f.id}>{f.fullName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex gap-2 justify-end pt-4">
                                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button type="submit" disabled={submitting} className="bg-neon-lime text-obsidian hover:bg-neon-lime/90">
                                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    {editingSubject ? 'Update Subject' : 'Create Subject'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    )
}
