"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { getAuthHeaders } from '@/lib/api-helpers'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, BookOpen, Trash2, User, Edit2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

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

interface SubjectWithIds extends Subject {
  departmentId: string
  batchId: string
  facultyId: string | null
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
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingSubject, setEditingSubject] = useState<SubjectWithIds | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '', code: '', departmentId: '', batchId: '', facultyId: ''
  })
  const [editFormData, setEditFormData] = useState({
    name: '', code: '', batchId: '', facultyId: ''
  })

  useEffect(() => {
    if (!loading && user && user.role !== 'PRINCIPAL' && user.role !== 'HOD') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'PRINCIPAL' || user?.role === 'HOD') {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const [subjectsRes, deptsRes, batchesRes, facultyRes] = await Promise.all([
        fetch('/api/admin/subjects', { headers }),
        fetch('/api/admin/departments', { headers }),
        fetch('/api/admin/batches', { headers }),
        fetch('/api/admin/faculty', { headers })
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
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers,
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
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch(`/api/admin/subjects/${id}`, { method: 'DELETE', headers })
      if (res.ok) fetchData()
    } catch (error) {
      console.error('Error deleting subject:', error)
    }
  }

  const handleEdit = (subject: any) => {
    setEditingSubject(subject)
    setEditFormData({
      name: subject.name,
      code: subject.code,
      batchId: subject.batchId,
      facultyId: subject.facultyId || ''
    })
    setShowEditDialog(true)
  }

  const handleUpdate = async () => {
    if (!editingSubject) return
    setSubmitting(true)
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch(`/api/admin/subjects/${editingSubject.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...editFormData, facultyId: editFormData.facultyId || null }),
      })
      if (res.ok) {
        setShowEditDialog(false)
        setEditingSubject(null)
        fetchData()
      }
    } catch (error) {
      console.error('Error updating subject:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || (user?.role !== 'PRINCIPAL' && user?.role !== 'HOD')) {
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
                    <Select value={formData.facultyId || 'none'} onValueChange={(v) => setFormData({ ...formData, facultyId: v === 'none' ? '' : v })}>
                      <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select faculty (optional)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Unassigned</SelectItem>
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
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(s)} className="text-white hover:text-white/80"><Edit2 className="w-4 h-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="bg-charcoal border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Edit Subject</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Subject Name</Label>
                <Input
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="bg-white/5 border-white/10"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={editFormData.code}
                  onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value.toUpperCase() })}
                  className="bg-white/5 border-white/10"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Batch</Label>
                <Select value={editFormData.batchId} onValueChange={(v) => setEditFormData({ ...editFormData, batchId: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {batches.map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assigned Faculty</Label>
                <Select value={editFormData.facultyId || 'none'} onValueChange={(v) => setEditFormData({ ...editFormData, facultyId: v === 'none' ? '' : v })}>
                  <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select faculty" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {faculty.map((f) => (<SelectItem key={f.id} value={f.id}>{f.fullName}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                <Button onClick={handleUpdate} disabled={submitting} className="bg-neon-lime text-obsidian">Save Changes</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
