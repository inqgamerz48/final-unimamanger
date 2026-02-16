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
import { Plus, Calendar, Trash2, Users, Edit2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface Batch {
  id: string
  name: string
  year: number
  semester: number
  departmentId: string
  department: { name: string; code: string }
  _count: { enrollments: number }
}

interface Department {
  id: string
  name: string
  code: string
}

export default function AdminBatches() {
  const { user, firebaseUser } = useAuth()
  const router = useRouter()
  const [batches, setBatches] = useState<Batch[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form States
  const [createFormData, setCreateFormData] = useState({
    name: '',
    year: new Date().getFullYear(),
    semester: 1,
    departmentId: ''
  })

  const [editingBatch, setEditingBatch] = useState<Batch | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    year: new Date().getFullYear(),
    semester: 1,
    departmentId: ''
  })

  const fetchData = async () => {
    try {
      setLoadingData(true)
      const headers = await getAuthHeaders(firebaseUser)

      const [batchesRes, deptsRes] = await Promise.all([
        fetch('/api/admin/batches', { headers }),
        fetch('/api/admin/departments', { headers })
      ])

      if (batchesRes.ok) {
        const data = await batchesRes.json()
        setBatches(data)
      }

      if (deptsRes.ok) {
        const data = await deptsRes.json()
        setDepartments(data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (user && (user.role === 'PRINCIPAL' || user.role === 'HOD')) {
      fetchData()
    }
  }, [user, firebaseUser])

  const [error, setError] = useState('')

  const handleCreate = async () => {
    setError('')
    if (!createFormData.name || !createFormData.departmentId) {
      setError('Name and Department are required')
      return
    }

    setSubmitting(true)
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/admin/batches', {
        method: 'POST',
        headers,
        body: JSON.stringify(createFormData)
      })

      const data = await res.json()

      if (res.ok) {
        setShowCreateDialog(false)
        setCreateFormData({
          name: '',
          year: new Date().getFullYear(),
          semester: 1,
          departmentId: ''
        })
        fetchData()
      } else {
        setError(data.error || 'Failed to create batch')
      }
    } catch (error) {
      console.error('Error creating batch:', error)
      setError('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (batch: Batch) => {
    setEditingBatch(batch)
    setEditFormData({
      name: batch.name,
      year: batch.year,
      semester: batch.semester,
      departmentId: batch.departmentId
    })
    setShowEditDialog(true)
  }

  const handleUpdate = async () => {
    if (!editingBatch) return
    setSubmitting(true)
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch(`/api/admin/batches/${editingBatch.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(editFormData)
      })

      if (res.ok) {
        setShowEditDialog(false)
        setEditingBatch(null)
        fetchData()
      }
    } catch (error) {
      console.error('Error updating batch', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this batch?')) return

    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch(`/api/admin/batches/${id}`, {
        method: 'DELETE',
        headers
      })

      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error deleting batch:', error)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Batches & Sections</h1>
          <div className="flex gap-3">
            <Button onClick={() => router.push('/admin/batches/promote')} variant="outline" className="border-neon-lime text-neon-lime hover:bg-neon-lime/10">
              <Users className="w-4 h-4 mr-2" />
              Promote Batches
            </Button>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-neon-lime text-obsidian hover:bg-neon-lime/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Batch
            </Button>
          </div>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-neon-lime border-t-transparent rounded-full animate-spin" />
          </div>
        ) : batches.length === 0 ? (
          <div className="text-center py-12 text-white/50">No batches created yet</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((batch) => (
              <Card key={batch.id} className="bg-charcoal border-white/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-neon-lime/10 flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-neon-lime" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{batch.name}</h3>
                        <p className="text-white/50 text-sm">Year {batch.year} - Sem {batch.semester}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm text-white/50">
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" />{batch._count?.enrollments || 0} students</span>
                    <span>{batch.department?.name}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5 flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(batch)} className="text-white hover:text-white/80">
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(batch.id)} className="text-red-500 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open)
          if (!open) setError('')
        }}>
          <DialogContent className="bg-charcoal border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Create New Batch</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && (
                <div className="p-3 text-sm bg-red-500/10 border border-red-500/20 text-red-500 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label>Batch Name</Label>
                <Input
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  placeholder="e.g. 2024 Computer Science A"
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    type="number"
                    value={createFormData.year}
                    onChange={(e) => setCreateFormData({ ...createFormData, year: parseInt(e.target.value) })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Input
                    type="number"
                    value={createFormData.semester}
                    onChange={(e) => setCreateFormData({ ...createFormData, semester: parseInt(e.target.value) })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={createFormData.departmentId}
                  onValueChange={(val) => setCreateFormData({ ...createFormData, departmentId: val })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent className="bg-charcoal border-white/10 text-white">
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={submitting} className="bg-neon-lime text-obsidian">Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="bg-charcoal border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Edit Batch</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Batch Name</Label>
                <Input
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    type="number"
                    value={editFormData.year}
                    onChange={(e) => setEditFormData({ ...editFormData, year: parseInt(e.target.value) })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Input
                    type="number"
                    value={editFormData.semester}
                    onChange={(e) => setEditFormData({ ...editFormData, semester: parseInt(e.target.value) })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={editFormData.departmentId}
                  onValueChange={(val) => setEditFormData({ ...editFormData, departmentId: val })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent className="bg-charcoal border-white/10 text-white">
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
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
