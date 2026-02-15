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
import { Plus, Calendar, Trash2, Users } from 'lucide-react'

interface Batch {
  id: string
  name: string
  year: number
  semester: number
  department: { name: string; code: string }
  _count: { enrollments: number }
}

interface Department {
  id: string
  name: string
}

export default function AdminBatches() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  const [batches, setBatches] = useState<Batch[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    year: '1',
    semester: '1',
    departmentId: '',
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
      fetchBatches()
      fetchDepartments()
    }
  }, [user])

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/admin/batches', {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setBatches(data)
      }
    } catch (error) {
      console.error('Error fetching batches:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/admin/departments', {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setDepartments(data)
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/batches', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...formData,
          year: parseInt(formData.year),
          semester: parseInt(formData.semester),
        }),
      })
      if (res.ok) {
        setFormData({ name: '', year: '1', semester: '1', departmentId: '' })
        setShowForm(false)
        fetchBatches()
      }
    } catch (error) {
      console.error('Error creating batch:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this batch?')) return
    try {
      const res = await fetch(`/api/admin/batches/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (res.ok) fetchBatches()
    } catch (error) {
      console.error('Error deleting batch:', error)
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
            <h1 className="text-3xl font-bold text-white">Batches</h1>
            <p className="text-white/50 mt-1">Manage year/semester batches</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-neon-lime text-obsidian hover:bg-neon-lime/90">
            <Plus className="w-4 h-4 mr-2" />Add Batch
          </Button>
        </div>

        {showForm && (
          <Card className="bg-charcoal border-white/5">
            <CardHeader><CardTitle className="text-white">Add New Batch</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/70">Batch Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="2024-27"
                      className="bg-white/5 border-white/10 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Department</Label>
                    <Select value={formData.departmentId} onValueChange={(v) => setFormData({ ...formData, departmentId: v })}>
                      <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Year</Label>
                    <Select value={formData.year} onValueChange={(v) => setFormData({ ...formData, year: v })}>
                      <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Year 1</SelectItem>
                        <SelectItem value="2">Year 2</SelectItem>
                        <SelectItem value="3">Year 3</SelectItem>
                        <SelectItem value="4">Year 4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Semester</Label>
                    <Select value={formData.semester} onValueChange={(v) => setFormData({ ...formData, semester: v })}>
                      <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7,8].map(s => (
                          <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting} className="bg-neon-lime text-obsidian">
                    {submitting ? 'Creating...' : 'Create Batch'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="border-white/10 text-white">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingData ? (
            <div className="col-span-full flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-neon-lime border-t-transparent rounded-full animate-spin" />
            </div>
          ) : batches.length === 0 ? (
            <div className="col-span-full text-center py-8 text-white/50">No batches created yet</div>
          ) : (
            batches.map((batch) => (
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
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" />{batch._count.enrollments} students</span>
                    <span>{batch.department.name}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(batch.id)} className="text-red-500 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
