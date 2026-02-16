'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { getAuthHeaders } from '@/lib/api-helpers'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { HODPageHeader } from '@/components/hod/page-header'
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
import { Calendar, MoreVertical, Pencil, Trash2, Users, GraduationCap, Upload, Eye, FileText, Loader2 } from 'lucide-react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { toast } from 'react-hot-toast'

interface Batch {
  id: string
  name: string
  year: number
  semester: number
  departmentId: string
  timetableUrl?: string | null
  _count: { enrollments: number }
  createdAt: string
}

export default function HODBatchesPage() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()

  const [batches, setBatches] = useState<Batch[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    year: '1',
    semester: '1',
  })

  const [editFormData, setEditFormData] = useState({
    name: '',
  })

  useEffect(() => {
    if (!loading && user && user.role !== 'HOD') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'HOD') {
      fetchBatches()
    }
  }, [user])

  const fetchBatches = async () => {
    try {
      setLoadingData(true)
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/hod/batches', { headers })
      if (res.ok) {
        const data = await res.json()
        setBatches(data)
      }
    } catch (error) {
      console.error('Error fetching batches:', error)
      toast.error('Failed to load batches')
    } finally {
      setLoadingData(false)
    }
  }

  const handleAddBatch = async () => {
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/hod/batches', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setShowAddDialog(false)
        setFormData({ name: '', year: '1', semester: '1' })
        fetchBatches()
        toast.success('Batch created successfully')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to create batch')
      }
    } catch (error) {
      console.error('Error creating batch:', error)
      toast.error('Failed to create batch')
    }
  }

  const handleEditBatch = async () => {
    if (!selectedBatch) return

    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch(`/api/hod/batches?id=${selectedBatch.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(editFormData),
      })

      if (res.ok) {
        setShowEditDialog(false)
        setSelectedBatch(null)
        fetchBatches()
        toast.success('Batch updated successfully')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to update batch')
      }
    } catch (error) {
      console.error('Error updating batch:', error)
      toast.error('Failed to update batch')
    }
  }

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm('Are you sure you want to delete this batch?')) return

    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch(`/api/hod/batches?id=${batchId}`, {
        method: 'DELETE',
        headers,
      })

      if (res.ok) {
        fetchBatches()
        toast.success('Batch deleted successfully')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to delete batch')
      }
    } catch (error) {
      console.error('Error deleting batch:', error)
      toast.error('Failed to delete batch')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedBatch || !e.target.files?.[0]) return

    const file = e.target.files[0]
    // Validate file type (PDF or Image)
    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      toast.error('Only PDF or Image files are allowed')
      return
    }

    setUploading(true)
    try {
      const storageRef = ref(storage, `timetables/${selectedBatch.id}/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const downloadUrl = await getDownloadURL(storageRef)

      // API Update
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch(`/api/hod/batches?id=${selectedBatch.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ timetableUrl: downloadUrl })
      })

      if (res.ok) {
        setShowUploadDialog(false)
        fetchBatches()
        toast.success('Timetable uploaded successfully')
      } else {
        toast.error('Failed to link timetable to batch')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload timetable')
    } finally {
      setUploading(false)
    }
  }

  const openEditDialog = (batch: Batch) => {
    setSelectedBatch(batch)
    setEditFormData({
      name: batch.name,
    })
    setShowEditDialog(true)
  }

  const openUploadDialog = (batch: Batch) => {
    setSelectedBatch(batch)
    setShowUploadDialog(true)
  }

  const columns = [
    {
      key: 'batch',
      header: 'Batch',
      render: (b: Batch) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-neon-lime/10 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-neon-lime" />
          </div>
          <div>
            <p className="text-white font-medium">{b.name}</p>
            <p className="text-white/50 text-sm">Year {b.year} - Semester {b.semester}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'timetable',
      header: 'Timetable',
      render: (b: Batch) => (
        <div>
          {b.timetableUrl ? (
            <a href={b.timetableUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-neon-lime hover:underline text-sm">
              <FileText className="w-4 h-4 mr-1" /> View
            </a>
          ) : (
            <span className="text-white/30 text-sm">Not Uploaded</span>
          )}
        </div>
      )
    },
    {
      key: 'students',
      header: 'Enrolled Students',
      render: (b: Batch) => (
        <div className="flex items-center gap-2 text-white/70">
          <Users className="w-4 h-4" />
          <span>{b._count.enrollments} students</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (b: Batch) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 border-neon-lime/50 text-neon-lime hover:bg-neon-lime/10" onClick={() => openUploadDialog(b)}>
            <Upload className="w-3 h-3 mr-1" /> Upload TimeTable
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-white">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-charcoal border-white/10">
              <DropdownMenuItem
                onClick={() => openEditDialog(b)}
                className="text-white hover:bg-white/10 cursor-pointer"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit Name
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteBatch(b.id)}
                className="text-red-400 hover:bg-white/10 cursor-pointer"
                disabled={b._count.enrollments > 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
          title="Batches"
          description="Manage department batches (Year/Semester)"
          actionLabel="Add Batch"
          onAction={() => setShowAddDialog(true)}
        />

        <Card className="bg-charcoal border-white/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-neon-lime" />
              <CardTitle className="text-white">Department Batches</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <HODDataTable
              columns={columns}
              data={batches}
              keyExtractor={(b) => b.id}
              loading={loadingData}
              emptyMessage="No batches found. Create your first batch to get started."
            />
          </CardContent>
        </Card>
      </div>

      {/* Add Batch Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-charcoal border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Batch</DialogTitle>
            <DialogDescription className="text-white/50">
              Create a new batch for your department
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Batch Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., 2024-2028"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Year *</Label>
                <Select
                  value={formData.year}
                  onValueChange={(value) => setFormData({ ...formData, year: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Year 1</SelectItem>
                    <SelectItem value="2">Year 2</SelectItem>
                    <SelectItem value="3">Year 3</SelectItem>
                    <SelectItem value="4">Year 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Semester *</Label>
                <Select
                  value={formData.semester}
                  onValueChange={(value) => setFormData({ ...formData, semester: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        Semester {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                onClick={handleAddBatch}
                disabled={!formData.name}
                className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
              >
                Create Batch
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Batch Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-charcoal border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
            <DialogDescription className="text-white/50">
              Update batch name
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Batch Name</Label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
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
                onClick={handleEditBatch}
                disabled={!editFormData.name}
                className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Timetable Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="bg-charcoal border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Timetable</DialogTitle>
            <DialogDescription className="text-white/50">
              Upload PDF or Image for {selectedBatch?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Select File</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileUpload}
                  className="bg-white/5 border-white/10 text-white cursor-pointer"
                  disabled={uploading}
                />
              </div>
              {uploading && <div className="text-sm text-neon-lime flex items-center gap-2 mt-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
              </div>}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowUploadDialog(false)}
                className="border-white/10 text-white"
                disabled={uploading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
