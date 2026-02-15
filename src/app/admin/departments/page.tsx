"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Building2, Users, Edit2, Trash2, X } from 'lucide-react'

interface User {
  id: string
  fullName: string
  role: string
}

interface Department {
  id: string
  name: string
  code: string
  hod: { fullName: string; id: string } | null
  hodId: string | null
  _count: { users: number; batches: number }
}

export default function AdminDepartments() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])
  const [facultyUsers, setFacultyUsers] = useState<User[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({ name: '', code: '', hodId: '' })

  // Get auth headers for API calls
  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (firebaseUser?.uid) {
      headers['x-firebase-uid'] = firebaseUser.uid
    }
    return headers
  }

  useEffect(() => {
    if (!loading && user && user.role !== 'PRINCIPAL') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'PRINCIPAL') {
      fetchDepartments()
      fetchFacultyUsers()
    }
  }, [user])

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
    } finally {
      setLoadingData(false)
    }
  }

  const fetchFacultyUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        // Filter for HOD and Faculty roles who can be department heads
        const eligibleHODs = data.filter((u: User) => 
          u.role === 'HOD' || u.role === 'FACULTY'
        )
        setFacultyUsers(eligibleHODs)
      }
    } catch (error) {
      console.error('Error fetching faculty:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          hodId: formData.hodId || undefined,
        }),
      })
      if (res.ok) {
        resetForm()
        setShowForm(false)
        fetchDepartments()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create department')
      }
    } catch (error) {
      console.error('Error creating department:', error)
      alert('Failed to create department')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDept) return
    
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/departments/${editingDept.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          hodId: formData.hodId || null,
        }),
      })
      if (res.ok) {
        resetForm()
        setShowEditForm(false)
        setEditingDept(null)
        fetchDepartments()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update department')
      }
    } catch (error) {
      console.error('Error updating department:', error)
      alert('Failed to update department')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return
    try {
      const res = await fetch(`/api/admin/departments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        fetchDepartments()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete department')
      }
    } catch (error) {
      console.error('Error deleting department:', error)
      alert('Failed to delete department')
    }
  }

  const openEditForm = (dept: Department) => {
    setEditingDept(dept)
    setFormData({
      name: dept.name,
      code: dept.code,
      hodId: dept.hodId || '',
    })
    setShowEditForm(true)
    setShowForm(false)
  }

  const resetForm = () => {
    setFormData({ name: '', code: '', hodId: '' })
  }

  if (loading || user?.role !== 'PRINCIPAL') {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Departments</h1>
            <p className="text-white/50 mt-1">Manage college departments</p>
          </div>
          <Button
            onClick={() => {
              resetForm()
              setShowForm(!showForm)
              setShowEditForm(false)
              setEditingDept(null)
            }}
            className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Department
          </Button>
        </div>

        {/* Create Form */}
        {showForm && (
          <Card className="bg-charcoal border-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Add New Department</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
                className="text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/70">Department Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Computer Science"
                      className="bg-white/5 border-white/10 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Code</Label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="CSE"
                      className="bg-white/5 border-white/10 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Head of Department (HOD)</Label>
                    <Select
                      value={formData.hodId}
                      onValueChange={(value) => setFormData({ ...formData, hodId: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select HOD" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Not Assigned</SelectItem>
                        {facultyUsers.map((faculty) => (
                          <SelectItem key={faculty.id} value={faculty.id}>
                            {faculty.fullName} ({faculty.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
                  >
                    {submitting ? 'Creating...' : 'Create Department'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="border-white/10 text-white hover:bg-white/5"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Edit Form */}
        {showEditForm && editingDept && (
          <Card className="bg-charcoal border-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Edit Department</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowEditForm(false)
                  setEditingDept(null)
                }}
                className="text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/70">Department Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Computer Science"
                      className="bg-white/5 border-white/10 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Code</Label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="CSE"
                      className="bg-white/5 border-white/10 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Head of Department (HOD)</Label>
                    <Select
                      value={formData.hodId}
                      onValueChange={(value) => setFormData({ ...formData, hodId: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select HOD" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Not Assigned</SelectItem>
                        {facultyUsers.map((faculty) => (
                          <SelectItem key={faculty.id} value={faculty.id}>
                            {faculty.fullName} ({faculty.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditForm(false)
                      setEditingDept(null)
                    }}
                    className="border-white/10 text-white hover:bg-white/5"
                  >
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
          ) : departments.length === 0 ? (
            <div className="col-span-full text-center py-8 text-white/50">
              No departments created yet
            </div>
          ) : (
            departments.map((dept) => (
              <Card key={dept.id} className="bg-charcoal border-white/5">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-neon-lime/10 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-neon-lime" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{dept.name}</h3>
                        <p className="text-white/50 text-sm">{dept.code}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm text-white/50">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {dept._count.users} users
                    </span>
                    <span>{dept._count.batches} batches</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-white/50">HOD: </span>
                      <span className="text-white">{dept.hod?.fullName || 'Not assigned'}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditForm(dept)}
                        className="text-neon-lime hover:text-neon-lime/80"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(dept.id)}
                        className="text-red-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
