'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { getAuthHeaders } from '@/lib/api-helpers'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { HODPageHeader } from '@/components/hod/page-header'
import { HODFilterBar } from '@/components/hod/filter-bar'
import { HODDataTable } from '@/components/hod/data-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { GraduationCap, MoreVertical, Pencil, Trash2, Mail, Phone } from 'lucide-react'

interface Faculty {
  id: string
  fullName: string
  email: string
  phone: string | null
  isActive: boolean
  createdAt: string
  department: { name: string; code: string }
  subjects: {
    id: string
    name: string
    code: string
    batch: { name: string; year: number; semester: number }
  }[]
}

export default function HODFacultyPage() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null)
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  })
  
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    phone: '',
    isActive: true,
  })

  useEffect(() => {
    if (!loading && user && user.role !== 'HOD') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'HOD') {
      fetchFaculty()
    }
  }, [user, searchQuery])

  const fetchFaculty = async () => {
    try {
      setLoadingData(true)
      const headers = await getAuthHeaders(firebaseUser)
      const queryParams = new URLSearchParams()
      if (searchQuery) queryParams.append('search', searchQuery)
      
      const res = await fetch(`/api/hod/faculty?${queryParams}`, { headers })
      if (res.ok) {
        const data = await res.json()
        setFaculty(data)
      }
    } catch (error) {
      console.error('Error fetching faculty:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleAddFaculty = async () => {
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/hod/faculty', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      })
      
      if (res.ok) {
        setShowAddDialog(false)
        setFormData({ fullName: '', email: '', phone: '', password: '' })
        fetchFaculty()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to add faculty')
      }
    } catch (error) {
      console.error('Error adding faculty:', error)
      alert('Failed to add faculty')
    }
  }

  const handleEditFaculty = async () => {
    if (!selectedFaculty) return
    
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch(`/api/hod/faculty/${selectedFaculty.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(editFormData),
      })
      
      if (res.ok) {
        setShowEditDialog(false)
        setSelectedFaculty(null)
        fetchFaculty()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update faculty')
      }
    } catch (error) {
      console.error('Error updating faculty:', error)
      alert('Failed to update faculty')
    }
  }

  const handleDeleteFaculty = async (facultyId: string) => {
    if (!confirm('Are you sure you want to delete this faculty member?')) return
    
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch(`/api/hod/faculty/${facultyId}`, {
        method: 'DELETE',
        headers,
      })
      
      if (res.ok) {
        fetchFaculty()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete faculty')
      }
    } catch (error) {
      console.error('Error deleting faculty:', error)
      alert('Failed to delete faculty')
    }
  }

  const openEditDialog = (faculty: Faculty) => {
    setSelectedFaculty(faculty)
    setEditFormData({
      fullName: faculty.fullName,
      phone: faculty.phone || '',
      isActive: faculty.isActive,
    })
    setShowEditDialog(true)
  }

  const columns = [
    {
      key: 'name',
      header: 'Faculty Member',
      render: (f: Faculty) => (
        <div>
          <p className="text-white font-medium">{f.fullName}</p>
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Mail className="w-3 h-3" />
            {f.email}
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Contact',
      render: (f: Faculty) => (
        <div className="text-white/70">
          {f.phone ? (
            <div className="flex items-center gap-2">
              <Phone className="w-3 h-3" />
              {f.phone}
            </div>
          ) : (
            <span className="text-white/30">No phone</span>
          )}
        </div>
      ),
    },
    {
      key: 'subjects',
      header: 'Assigned Subjects',
      render: (f: Faculty) => (
        <div className="flex flex-wrap gap-1">
          {f.subjects.length > 0 ? (
            f.subjects.map((s) => (
              <Badge key={s.id} variant="secondary" className="text-xs">
                {s.code}
              </Badge>
            ))
          ) : (
            <span className="text-white/30 text-sm">No subjects assigned</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (f: Faculty) => (
        <Badge className={f.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}>
          {f.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (f: Faculty) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-white">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-charcoal border-white/10">
            <DropdownMenuItem
              onClick={() => openEditDialog(f)}
              className="text-white hover:bg-white/10 cursor-pointer"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDeleteFaculty(f.id)}
              className="text-red-400 hover:bg-white/10 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (loading || user?.role !== 'HOD') {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <HODPageHeader
          title="Faculty"
          description="Manage department faculty members"
          actionLabel="Add Faculty"
          onAction={() => setShowAddDialog(true)}
        />

        <Card className="bg-charcoal border-white/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-neon-lime" />
              <CardTitle className="text-white">Faculty Directory</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <HODFilterBar
              searchPlaceholder="Search by name or email..."
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
            />
            
            <HODDataTable
              columns={columns}
              data={faculty}
              keyExtractor={(f) => f.id}
              loading={loadingData}
              emptyMessage="No faculty members found"
            />
          </CardContent>
        </Card>
      </div>

      {/* Add Faculty Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-charcoal border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Faculty</DialogTitle>
            <DialogDescription className="text-white/50">
              Create a new faculty member in your department
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter full name"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create password"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="border-white/10 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddFaculty}
                disabled={!formData.fullName || !formData.email || !formData.password}
                className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
              >
                Add Faculty
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Faculty Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-charcoal border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Faculty</DialogTitle>
            <DialogDescription className="text-white/50">
              Update faculty member details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={editFormData.fullName}
                onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editFormData.isActive}
                onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <Label className="mb-0">Active</Label>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="border-white/10 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditFaculty}
                disabled={!editFormData.fullName}
                className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
