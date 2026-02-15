"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, BookOpen, Trash2, User } from 'lucide-react'

interface Subject {
  id: string
  name: string
  code: string
  department: { name: string }
  batch: { name: string }
  faculty: { fullName: string } | null
}

interface Department {
  id: string
  name: string
}

interface Batch {
  id: string
  name: string
}

interface Faculty {
  id: string
  fullName: string
}

export default function AdminSubjects() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '', code: '', departmentId: '', batchId: '', facultyId: ''
  })

  const getAuthHeaders = () => {
    if (!firebaseUser) return { 'Content-Type': 'application/json' }
    return {
      'x-firebase-uid': firebaseUser.uid,
      'Content-Type': 'application/json',
    }
  }

  useEffect(() => {
    if (!loading && user && user.role !== 'PRINCIPAL') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'PRINCIPAL') {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      const [subjectsRes, deptsRes, batchesRes, facultyRes] = await Promise.all([
        fetch('/api/admin/subjects', { headers: getAuthHeaders() }),
        fetch('/api/admin/departments', { headers: getAuthHeaders() }),
        fetch('/api/admin/batches', { headers: getAuthHeaders() }),
        fetch('/api/admin/faculty', { headers: getAuthHeaders() })
      ])
      if (subjectsRes.ok) setSubjects(await subjectsRes.json())
      if (deptsRes.ok) setDepartments(await deptsRes.json())
      if (batchesRes.ok) setBatches(await batchesRes.json())
      if (facultyRes.ok) setFaculty(await facultyRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...formData, facultyId: formData.facultyId || null }),
      })
      if (res.ok) {
        setFormData({ name: '', code: '', departmentId: '', batchId: '', facultyId: '' })
        setShowForm(false)
        fetchData()
      }
    } catch (error) {
      console.error('Error creating subject:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this subject?')) return
    try {
      const res = await fetch(`/api/admin/subjects/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
      if (res.ok) fetchData()
    } catch (error) {
      console.error('Error deleting subject:', error)
    }
  }

  if (loading || user?.role !== 'PRINCIPAL') {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Subjects</h1>
            <p className="text-white/50 mt-1">Manage subjects</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-neon-lime text-obsidian hover:bg-neon-lime/90">
            <Plus className="w-4 h-4 mr-2" />Add Subject
          </Button>
        </div>

        {showForm && (
          <Card className="bg-charcoal border-white/5">
            <CardHeader><CardTitle className="text-white">Add New Subject</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/70">Subject Name</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Data Structures" className="bg-white/5 border-white/10 text-white" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Code</Label>
                    <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="CS201" className="bg-white/5 border-white/10 text-white" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Department</Label>
                    <Select value={formData.departmentId} onValueChange={(v) => setFormData({ ...formData, departmentId: v })}>
                      <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Batch</Label>
                    <Select value={formData.batchId} onValueChange={(v) => setFormData({ ...formData, batchId: v })}>
                      <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select batch" /></SelectTrigger>
                      <SelectContent>
                        {batches.map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-white/70">Assigned Faculty</Label>
                    <Select value={formData.facultyId} onValueChange={(v) => setFormData({ ...formData, facultyId: v })}>
                      <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select faculty (optional)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {faculty.map((f) => (<SelectItem key={f.id} value={f.id}>{f.fullName}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting} className="bg-neon-lime text-obsidian">{submitting ? 'Creating...' : 'Create Subject'}</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="border-white/10 text-white">Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="bg-charcoal border-white/5">
          <CardHeader><CardTitle className="text-white">All Subjects ({subjects.length})</CardTitle></CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="flex items-center justify-center py-8"><div className="w-8 h-8 border-2 border-neon-lime border-t-transparent rounded-full animate-spin" /></div>
            ) : subjects.length === 0 ? (
              <div className="text-center py-8 text-white/50">No subjects created yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-white/70">Name</th>
                      <th className="text-left py-3 px-4 text-white/70">Code</th>
                      <th className="text-left py-3 px-4 text-white/70">Department</th>
                      <th className="text-left py-3 px-4 text-white/70">Batch</th>
                      <th className="text-left py-3 px-4 text-white/70">Faculty</th>
                      <th className="text-left py-3 px-4 text-white/70">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((s) => (
                      <tr key={s.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4 text-white">{s.name}</td>
                        <td className="py-3 px-4 text-white/70">{s.code}</td>
                        <td className="py-3 px-4 text-white/70">{s.department.name}</td>
                        <td className="py-3 px-4 text-white/70">{s.batch.name}</td>
                        <td className="py-3 px-4 text-white/70">{s.faculty?.fullName || '-'}</td>
                        <td className="py-3 px-4">
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
