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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { BookOpen, MoreVertical, Pencil, Trash2, User } from 'lucide-react'

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

interface Subject {
  id: string
  name: string
  code: string
  department: { name: string; code: string }
  batch: { name: string; year: number; semester: number }
  faculty: { id: string; fullName: string; email: string } | null
}

export default function HODCoursesPage() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [selectedBatch, setSelectedBatch] = useState('')
  
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    batchId: '',
    facultyId: '',
  })
  
  const [editFormData, setEditFormData] = useState({
    name: '',
    code: '',
    facultyId: '',
  })

  useEffect(() => {
    if (!loading && user && user.role !== 'HOD') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'HOD') {
      fetchBatches()
      fetchFaculty()
      fetchSubjects()
    }
  }, [user, selectedBatch])

  const fetchBatches = async () => {
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/hod/batches', { headers })
      if (res.ok) {
        const data = await res.json()
        setBatches(data)
      }
    } catch (error) {
      console.error('Error fetching batches:', error)
    }
  }

  const fetchFaculty = async () => {
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/hod/faculty', { headers })
      if (res.ok) {
        const data = await res.json()
        setFaculty(data)
      }
    } catch (error) {
      console.error('Error fetching faculty:', error)
    }
  }

  const fetchSubjects = async () => {
    try {
      setLoadingData(true)
      const headers = await getAuthHeaders(firebaseUser)
      const queryParams = new URLSearchParams()
      if (selectedBatch) queryParams.append('batchId', selectedBatch)
      
      const res = await fetch(`/api/hod/subjects?${queryParams}`, { headers })
      if (res.ok) {
        const data = await res.json()
        setSubjects(data)
      }
    } catch (error) {
      console.error('Error fetching subjects:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleAddSubject = async () => {
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/hod/subjects', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      })
      
      if (res.ok) {
        setShowAddDialog(false)
        setFormData({ name: '', code: '', batchId: '', facultyId: '' })
        fetchSubjects()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to add subject')
      }
    } catch (error) {
      console.error('Error adding subject:', error)
      alert('Failed to add subject')
    }
  }

  const handleEditSubject = async () => {
    if (!selectedSubject) return
    
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch(`/api/hod/subjects/${selectedSubject.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(editFormData),
      })
      
      if (res.ok) {
        setShowEditDialog(false)
        setSelectedSubject(null)
        fetchSubjects()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update subject')
      }
    } catch (error) {
      console.error('Error updating subject:', error)
      alert('Failed to update subject')
    }
  }

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return
    
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch(`/api/hod/subjects/${subjectId}`, {
        method: 'DELETE',
        headers,
      })
      
      if (res.ok) {
        fetchSubjects()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete subject')
      }
    } catch (error) {
      console.error('Error deleting subject:', error)
      alert('Failed to delete subject')
    }
  }

  const openEditDialog = (subject: Subject) => {
    setSelectedSubject(subject)
    setEditFormData({
      name: subject.name,
      code: subject.code,
      facultyId: subject.faculty?.id || '',
    })
    setShowEditDialog(true)
  }

  const batchFilterOptions = batches.map(b => ({
    value: b.id,
    label: `${b.name} (Year ${b.year}, Sem ${b.semester})`,
  }))

  const columns = [
    {
      key: 'subject',
      header: 'Subject',
      render: (s: Subject) => (
        <div>
          <p className="text-white font-medium">{s.name}</p>
          <p className="text-white/50 text-sm">{s.code}</p>
        </div>
      ),
    },
    {
      key: 'batch',
      header: 'Batch',
      render: (s: Subject) => (
        <div className="text-white/70">
          <p className="font-medium">{s.batch.name}</p>
          <p className="text-white/50 text-sm">
            Year {s.batch.year}, Sem {s.batch.semester}
          </p>
        </div>
      ),
    },
    {
      key: 'faculty',
      header: 'Assigned Faculty',
      render: (s: Subject) => (
        <div className="text-white/70">
          {s.faculty ? (
            <div className="flex items-center gap-2">
              <User className="w-3 h-3" />
              <span>{s.faculty.fullName}</span>
            </div>
          ) : (
            <Badge variant="outline" className="text-yellow-500 border-yellow-500/20">
              Not Assigned
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (s: Subject) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-white">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-charcoal border-white/10">
            <DropdownMenuItem
              onClick={() => openEditDialog(s)}
              className="text-white hover:bg-white/10 cursor-pointer"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDeleteSubject(s.id)}
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
          title="Courses"
          description="Manage department subjects and courses"
          actionLabel="Add Subject"
          onAction={() => setShowAddDialog(true)}
        />

        <Card className="bg-charcoal border-white/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-neon-lime" />
              <CardTitle className="text-white">Subject Directory</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <HODFilterBar
              searchPlaceholder="Filter by batch..."
              searchValue=""
              onSearchChange={() => {}}
              filters={[
                {
                  key: 'batch',
                  placeholder: 'Batch',
                  value: selectedBatch,
                  options: batchFilterOptions,
                  onChange: setSelectedBatch,
                },
              ]}
            />
            
            <HODDataTable
              columns={columns}
              data={subjects}
              keyExtractor={(s) => s.id}
              loading={loadingData}
              emptyMessage="No subjects found"
            />
          </CardContent>
        </Card>
      </div>

      {/* Add Subject Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-charcoal border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Subject</DialogTitle>
            <DialogDescription className="text-white/50">
              Create a new subject in your department
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Subject Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Data Structures"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Subject Code *</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., CS201"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Batch *</Label>
              <Select
                value={formData.batchId}
                onValueChange={(value) => setFormData({ ...formData, batchId: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name} (Year {batch.year}, Sem {batch.semester})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assign Faculty</Label>
              <Select
                value={formData.facultyId}
                onValueChange={(value) => setFormData({ ...formData, facultyId: value === '__NONE__' ? '' : value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select faculty (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__NONE__">Not assigned</SelectItem>
                  {faculty.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                onClick={handleAddSubject}
                disabled={!formData.name || !formData.code || !formData.batchId}
                className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
              >
                Add Subject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Subject Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-charcoal border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription className="text-white/50">
              Update subject details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Subject Name</Label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Subject Code</Label>
              <Input
                value={editFormData.code}
                onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Assign Faculty</Label>
              <Select
                value={editFormData.facultyId || '__NONE__'}
                onValueChange={(value) => setEditFormData({ ...editFormData, facultyId: value === '__NONE__' ? '' : value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select faculty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__NONE__">Not assigned</SelectItem>
                  {faculty.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                onClick={handleEditSubject}
                disabled={!editFormData.name || !editFormData.code}
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
