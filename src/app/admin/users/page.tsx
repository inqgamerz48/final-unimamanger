"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Search, GraduationCap, UserCog, Shield, Plus, Edit2, Trash2, X } from 'lucide-react'

interface Department {
  id: string
  name: string
  code: string
}

interface UserData {
  id: string
  firebaseUid: string
  fullName: string
  email: string
  role: string
  department: { name: string; id: string } | null
  departmentId: string | null
  studentId: string | null
  phone: string | null
  isActive: boolean
  createdAt: string
}

const ROLES = ['PRINCIPAL', 'HOD', 'FACULTY', 'STUDENT'] as const

export default function AdminUsers() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserData[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Get auth headers for API calls
  const getAuthHeaders = () => {
    if (!firebaseUser) return {}
    return {
      'x-firebase-uid': firebaseUser.uid,
      'Content-Type': 'application/json',
    }
  }
   
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'STUDENT',
    departmentId: '',
    phone: '',
    studentId: '',
  })

  useEffect(() => {
    if (!loading && user && user.role !== 'PRINCIPAL') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'PRINCIPAL') {
      fetchUsers()
      fetchDepartments()
    }
  }, [user])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...formData,
          departmentId: formData.departmentId || undefined,
        }),
      })
      
      if (res.ok) {
        resetForm()
        setShowCreateModal(false)
        fetchUsers()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          fullName: formData.fullName,
          role: formData.role,
          departmentId: formData.departmentId || null,
          phone: formData.phone || null,
          studentId: formData.studentId || null,
        }),
      })
      
      if (res.ok) {
        resetForm()
        setShowEditModal(false)
        setEditingUser(null)
        fetchUsers()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Failed to update user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return
    }
    
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      
      if (res.ok) {
        fetchUsers()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    }
  }

  const openEditModal = (user: UserData) => {
    setEditingUser(user)
    setFormData({
      fullName: user.fullName,
      email: user.email,
      password: '',
      role: user.role,
      departmentId: user.departmentId || '',
      phone: user.phone || '',
      studentId: user.studentId || '',
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      password: '',
      role: 'STUDENT',
      departmentId: '',
      phone: '',
      studentId: '',
    })
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'PRINCIPAL':
        return <Shield className="h-4 w-4" />
      case 'HOD':
        return <UserCog className="h-4 w-4" />
      case 'FACULTY':
        return <GraduationCap className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'PRINCIPAL':
        return <Badge variant="destructive">Principal</Badge>
      case 'HOD':
        return <Badge variant="warning">HOD</Badge>
      case 'FACULTY':
        return <Badge variant="secondary">Faculty</Badge>
      default:
        return <Badge>Student</Badge>
    }
  }

  if (loading || user?.role !== 'PRINCIPAL') {
    return null
  }

  const filteredUsers = users.filter(u => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesRole && matchesSearch
  })

  const roleCounts = {
    PRINCIPAL: users.filter(u => u.role === 'PRINCIPAL').length,
    HOD: users.filter(u => u.role === 'HOD').length,
    FACULTY: users.filter(u => u.role === 'FACULTY').length,
    STUDENT: users.filter(u => u.role === 'STUDENT').length,
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">User Management</h1>
            <p className="text-white/50 mt-1">Create, edit, and manage all users in the system</p>
          </div>
          <Button
            onClick={() => {
              resetForm()
              setShowCreateModal(true)
            }}
            className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        </div>

        {/* Role Counts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(roleCounts).map(([role, count]) => (
            <Card key={role} className="bg-charcoal border-white/5 cursor-pointer hover:bg-white/5"
              onClick={() => setRoleFilter(roleFilter === role ? 'all' : role)}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/50">{role}</p>
                    <p className="text-2xl font-bold text-white mt-1">{count}</p>
                  </div>
                  {getRoleIcon(role)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="bg-charcoal border-white/5">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40 bg-white/5 border-white/10">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="PRINCIPAL">Principal</SelectItem>
                  <SelectItem value="HOD">HOD</SelectItem>
                  <SelectItem value="FACULTY">Faculty</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-charcoal border-white/5">
          <CardHeader>
            <CardTitle className="text-white">All Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-neon-lime border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-white/50">
                No users found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Name</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Email</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Role</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Department</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Student ID</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4 text-white font-medium">{u.fullName}</td>
                        <td className="py-3 px-4 text-white/70">{u.email}</td>
                        <td className="py-3 px-4">{getRoleBadge(u.role)}</td>
                        <td className="py-3 px-4 text-white/70">{u.department?.name || '-'}</td>
                        <td className="py-3 px-4 text-white/70">{u.studentId || '-'}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditModal(u)}
                              className="text-neon-lime hover:text-neon-lime/80"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(u.id, u.fullName)}
                              className="text-red-500 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-charcoal border-white/5 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Create New User</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  className="text-white/50 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white/70">Full Name *</Label>
                      <Input
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="John Doe"
                        className="bg-white/5 border-white/10 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70">Email *</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        className="bg-white/5 border-white/10 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70">Password *</Label>
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Min 6 characters"
                        className="bg-white/5 border-white/10 text-white"
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70">Role *</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) => setFormData({ ...formData, role: value })}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRINCIPAL">Principal</SelectItem>
                          <SelectItem value="HOD">HOD</SelectItem>
                          <SelectItem value="FACULTY">Faculty</SelectItem>
                          <SelectItem value="STUDENT">Student</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70">Department</Label>
                      <Select
                        value={formData.departmentId}
                        onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70">Phone</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1234567890"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    {formData.role === 'STUDENT' && (
                      <div className="space-y-2">
                        <Label className="text-white/70">Student ID</Label>
                        <Input
                          value={formData.studentId}
                          onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                          placeholder="24UNI-CSE-001"
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
                    >
                      {submitting ? 'Creating...' : 'Create User'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateModal(false)}
                      className="border-white/10 text-white hover:bg-white/5"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-charcoal border-white/5 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Edit User</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingUser(null)
                  }}
                  className="text-white/50 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white/70">Full Name</Label>
                      <Input
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="John Doe"
                        className="bg-white/5 border-white/10 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70">Email (Read-only)</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        disabled
                        className="bg-white/5 border-white/10 text-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70">Role</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) => setFormData({ ...formData, role: value })}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRINCIPAL">Principal</SelectItem>
                          <SelectItem value="HOD">HOD</SelectItem>
                          <SelectItem value="FACULTY">Faculty</SelectItem>
                          <SelectItem value="STUDENT">Student</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70">Department</Label>
                      <Select
                        value={formData.departmentId}
                        onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70">Phone</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1234567890"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    {formData.role === 'STUDENT' && (
                      <div className="space-y-2">
                        <Label className="text-white/70">Student ID</Label>
                        <Input
                          value={formData.studentId}
                          onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                          placeholder="24UNI-CSE-001"
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-4">
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
                        setShowEditModal(false)
                        setEditingUser(null)
                      }}
                      className="border-white/10 text-white hover:bg-white/5"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
