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
import { FileText, MoreVertical, Pencil, Trash2, Calendar, User } from 'lucide-react'

interface Subject {
  id: string
  name: string
  code: string
  batch: { name: string; year: number; semester: number }
}

interface Assignment {
  id: string
  title: string
  description: string | null
  dueDate: string
  createdAt: string
  createdBy: { fullName: string; role: string }
  subject: {
    name: string
    code: string
    batch: { name: string; year: number; semester: number }
  }
  _count: { submissions: number }
}

export default function HODAssignmentsPage() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState('')
  
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    dueDate: '',
  })
  
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
  })

  useEffect(() => {
    if (!loading && user && user.role !== 'HOD') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'HOD') {
      fetchSubjects()
      fetchAssignments()
    }
  }, [user, selectedSubject])

  const fetchSubjects = async () => {
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/hod/subjects', { headers })
      if (res.ok) {
        const data = await res.json()
        setSubjects(data)
      }
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  const fetchAssignments = async () => {
    try {
      setLoadingData(true)
      const headers = await getAuthHeaders(firebaseUser)
      const queryParams = new URLSearchParams()
      if (selectedSubject) queryParams.append('subjectId', selectedSubject)
      
      const res = await fetch(`/api/hod/assignments?${queryParams}`, { headers })
      if (res.ok) {
        const data = await res.json()
        setAssignments(data)
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleAddAssignment = async () => {
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/hod/assignments', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      })
      
      if (res.ok) {
        setShowAddDialog(false)
        setFormData({ title: '', description: '', subjectId: '', dueDate: '' })
        fetchAssignments()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to add assignment')
      }
    } catch (error) {
      console.error('Error adding assignment:', error)
      alert('Failed to add assignment')
    }
  }

  const handleEditAssignment = async () => {
    if (!selectedAssignment) return
    
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch(`/api/hod/assignments/${selectedAssignment.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(editFormData),
      })
      
      if (res.ok) {
        setShowEditDialog(false)
        setSelectedAssignment(null)
        fetchAssignments()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update assignment')
      }
    } catch (error) {
      console.error('Error updating assignment:', error)
      alert('Failed to update assignment')
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return
    
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch(`/api/hod/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers,
      })
      
      if (res.ok) {
        fetchAssignments()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete assignment')
      }
    } catch (error) {
      console.error('Error deleting assignment:', error)
      alert('Failed to delete assignment')
    }
  }

  const openEditDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setEditFormData({
      title: assignment.title,
      description: assignment.description || '',
      dueDate: assignment.dueDate.split('T')[0],
    })
    setShowEditDialog(true)
  }

  const subjectFilterOptions = subjects.map(s => ({
    value: s.id,
    label: `${s.name} (${s.batch.name})`,
  }))

  const columns = [
    {
      key: 'assignment',
      header: 'Assignment',
      render: (a: Assignment) => (
        <div>
          <p className="text-white font-medium">{a.title}</p>
          <p className="text-white/50 text-sm line-clamp-1">
            {a.description || 'No description'}
          </p>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (a: Assignment) => (
        <div className="text-white/70">
          <p className="font-medium">{a.subject.name}</p>
          <p className="text-white/50 text-sm">{a.subject.code}</p>
        </div>
      ),
    },
    {
      key: 'batch',
      header: 'Batch',
      render: (a: Assignment) => (
        <div className="text-white/70 text-sm">
          {a.subject.batch.name}
        </div>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (a: Assignment) => {
        const isOverdue = new Date(a.dueDate) < new Date()
        return (
          <div className={`flex items-center gap-2 ${isOverdue ? 'text-red-400' : 'text-white/70'}`}>
            <Calendar className="w-3 h-3" />
            {new Date(a.dueDate).toLocaleDateString('en-IN')}
            {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
          </div>
        )
      },
    },
    {
      key: 'submissions',
      header: 'Submissions',
      render: (a: Assignment) => (
        <Badge className="bg-blue-500/10 text-blue-500">
          {a._count.submissions}
        </Badge>
      ),
    },
    {
      key: 'createdBy',
      header: 'Created By',
      render: (a: Assignment) => (
        <div className="flex items-center gap-2 text-white/70">
          <User className="w-3 h-3" />
          <span className="text-sm">{a.createdBy.fullName}</span>
          <Badge variant="outline" className="text-xs">{a.createdBy.role}</Badge>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (a: Assignment) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-white">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-charcoal border-white/10">
            <DropdownMenuItem
              onClick={() => openEditDialog(a)}
              className="text-white hover:bg-white/10 cursor-pointer"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDeleteAssignment(a.id)}
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
          title="Assignments"
          description="Manage department assignments"
          actionLabel="Add Assignment"
          onAction={() => setShowAddDialog(true)}
        />

        <Card className="bg-charcoal border-white/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-neon-lime" />
              <CardTitle className="text-white">Assignment Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <HODFilterBar
              searchPlaceholder="Filter by subject..."
              searchValue=""
              onSearchChange={() => {}}
              filters={[
                {
                  key: 'subject',
                  placeholder: 'Subject',
                  value: selectedSubject,
                  options: subjectFilterOptions,
                  onChange: setSelectedSubject,
                },
              ]}
            />
            
            <HODDataTable
              columns={columns}
              data={assignments}
              keyExtractor={(a) => a.id}
              loading={loadingData}
              emptyMessage="No assignments found"
            />
          </CardContent>
        </Card>
      </div>

      {/* Add Assignment Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-charcoal border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Assignment</DialogTitle>
            <DialogDescription className="text-white/50">
              Create a new assignment for your department
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Assignment title"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Assignment description"
                className="w-full h-24 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30"
              />
            </div>
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Select
                value={formData.subjectId}
                onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.batch.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
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
                onClick={handleAddAssignment}
                disabled={!formData.title || !formData.subjectId || !formData.dueDate}
                className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
              >
                Add Assignment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-charcoal border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription className="text-white/50">
              Update assignment details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                className="w-full h-24 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={editFormData.dueDate}
                onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
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
                onClick={handleEditAssignment}
                disabled={!editFormData.title || !editFormData.dueDate}
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
