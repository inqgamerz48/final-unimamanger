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
import { Users, MoreVertical, Pencil, Trash2, Mail, Phone, IdCard } from 'lucide-react'

interface Batch {
  id: string
  name: string
  year: number
  semester: number
}

interface Student {
  id: string
  fullName: string
  email: string
  phone: string | null
  studentId: string | null
  isActive: boolean
  createdAt: string
  department: { name: string; code: string }
  enrollments: {
    id: string
    batch: { name: string; year: number; semester: number }
    academicYear: string
  }[]
}

export default function HODStudentsPage() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  
  const [students, setStudents] = useState<Student[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBatch, setSelectedBatch] = useState('')
  
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    studentId: '',
    password: '',
    batchId: '',
  })
  
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    phone: '',
    studentId: '',
    isActive: true,
    batchId: '',
  })

  useEffect(() => {
    if (!loading && user && user.role !== 'HOD') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'HOD') {
      fetchBatches()
      fetchStudents()
    }
  }, [user, searchQuery, selectedBatch])

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

  const fetchStudents = async () => {
    try {
      setLoadingData(true)
      const headers = await getAuthHeaders(firebaseUser)
      const queryParams = new URLSearchParams()
      if (searchQuery) queryParams.append('search', searchQuery)
      if (selectedBatch) queryParams.append('batchId', selectedBatch)
      
      const res = await fetch(`/api/hod/students?${queryParams}`, { headers })
      if (res.ok) {
        const data = await res.json()
        setStudents(data)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleAddStudent = async () => {
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/hod/students', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      })
      
      if (res.ok) {
        setShowAddDialog(false)
        setFormData({ fullName: '', email: '', phone: '', studentId: '', password: '', batchId: '' })
        fetchStudents()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to add student')
      }
    } catch (error) {
      console.error('Error adding student:', error)
      alert('Failed to add student')
    }
  }

  const handleEditStudent = async () => {
    if (!selectedStudent) return
    
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch(`/api/hod/students/${selectedStudent.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(editFormData),
      })
      
      if (res.ok) {
        setShowEditDialog(false)
        setSelectedStudent(null)
        fetchStudents()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update student')
      }
    } catch (error) {
      console.error('Error updating student:', error)
      alert('Failed to update student')
    }
  }

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return
    
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch(`/api/hod/students/${studentId}`, {
        method: 'DELETE',
        headers,
      })
      
      if (res.ok) {
        fetchStudents()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete student')
      }
    } catch (error) {
      console.error('Error deleting student:', error)
      alert('Failed to delete student')
    }
  }

  const openEditDialog = (student: Student) => {
    setSelectedStudent(student)
    setEditFormData({
      fullName: student.fullName,
      phone: student.phone || '',
      studentId: student.studentId || '',
      isActive: student.isActive,
      batchId: student.enrollments[0]?.batch ? batches.find(b => b.name === student.enrollments[0].batch.name)?.id || '' : '',
    })
    setShowEditDialog(true)
  }

  const batchFilterOptions = batches.map(b => ({
    value: b.id,
    label: `${b.name} (Year ${b.year}, Sem ${b.semester})`,
  }))

  const columns = [
    {
      key: 'name',
      header: 'Student',
      render: (s: Student) => (
        <div>
          <p className="text-white font-medium">{s.fullName}</p>
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Mail className="w-3 h-3" />
            {s.email}
          </div>
        </div>
      ),
    },
    {
      key: 'studentId',
      header: 'Student ID',
      render: (s: Student) => (
        <div className="text-white/70">
          {s.studentId ? (
            <div className="flex items-center gap-2">
              <IdCard className="w-3 h-3" />
              {s.studentId}
            </div>
          ) : (
            <span className="text-white/30">Not assigned</span>
          )}
        </div>
      ),
    },
    {
      key: 'batch',
      header: 'Batch',
      render: (s: Student) => (
        <div className="text-white/70">
          {s.enrollments.length > 0 ? (
            <div>
              <p className="font-medium">{s.enrollments[0].batch.name}</p>
              <p className="text-white/50 text-sm">
                Year {s.enrollments[0].batch.year}, Sem {s.enrollments[0].batch.semester}
              </p>
            </div>
          ) : (
            <span className="text-white/30">Not enrolled</span>
          )}
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (s: Student) => (
        <div className="text-white/70">
          {s.phone ? (
            <div className="flex items-center gap-2">
              <Phone className="w-3 h-3" />
              {s.phone}
            </div>
          ) : (
            <span className="text-white/30">No phone</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s: Student) => (
        <Badge className={s.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}>
          {s.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (s: Student) => (
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
              onClick={() => handleDeleteStudent(s.id)}
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
          title="Students"
          description="Manage department students"
          actionLabel="Add Student"
          onAction={() => setShowAddDialog(true)}
        />

        <Card className="bg-charcoal border-white/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-neon-lime" />
              <CardTitle className="text-white">Student Directory</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <HODFilterBar
              searchPlaceholder="Search by name, email, or ID..."
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
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
              data={students}
              keyExtractor={(s) => s.id}
              loading={loadingData}
              emptyMessage="No students found"
            />
          </CardContent>
        </Card>
      </div>

      {/* Add Student Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-charcoal border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription className="text-white/50">
              Create a new student in your department
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Student ID</Label>
                <Input
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  placeholder="e.g., 24CS001"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone number"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
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
            <div className="space-y-2">
              <Label>Batch</Label>
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
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="border-white/10 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddStudent}
                disabled={!formData.fullName || !formData.email || !formData.password}
                className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
              >
                Add Student
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-charcoal border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription className="text-white/50">
              Update student details
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Student ID</Label>
                <Input
                  value={editFormData.studentId}
                  onChange={(e) => setEditFormData({ ...editFormData, studentId: e.target.value })}
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
            </div>
            <div className="space-y-2">
              <Label>Batch</Label>
              <Select
                value={editFormData.batchId}
                onValueChange={(value) => setEditFormData({ ...editFormData, batchId: value })}
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
                onClick={handleEditStudent}
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
