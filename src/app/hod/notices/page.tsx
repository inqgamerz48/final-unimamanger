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
import { Switch } from '@/components/ui/switch'
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
import { Bell, MoreVertical, Pencil, Trash2, Pin, User } from 'lucide-react'

interface Batch {
  id: string
  name: string
  year: number
  semester: number
}

interface Notice {
  id: string
  title: string
  content: string
  priority: string
  isPinned: boolean
  createdAt: string
  postedBy: { fullName: string; role: string }
  department: { name: string; code: string } | null
  batch: { name: string; year: number; semester: number } | null
}

export default function HODNoticesPage() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  
  const [notices, setNotices] = useState<Notice[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loadingData, setLoadingData] = useState(true)
  
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'NORMAL',
    isPinned: false,
    batchId: '',
  })
  
  const [editFormData, setEditFormData] = useState({
    title: '',
    content: '',
    priority: 'NORMAL',
    isPinned: false,
  })

  useEffect(() => {
    if (!loading && user && user.role !== 'HOD') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'HOD') {
      fetchBatches()
      fetchNotices()
    }
  }, [user])

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

  const fetchNotices = async () => {
    try {
      setLoadingData(true)
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/hod/notices', { headers })
      if (res.ok) {
        const data = await res.json()
        setNotices(data)
      }
    } catch (error) {
      console.error('Error fetching notices:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleAddNotice = async () => {
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/hod/notices', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      })
      
      if (res.ok) {
        setShowAddDialog(false)
        setFormData({ title: '', content: '', priority: 'NORMAL', isPinned: false, batchId: '' })
        fetchNotices()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to add notice')
      }
    } catch (error) {
      console.error('Error adding notice:', error)
      alert('Failed to add notice')
    }
  }

  const handleEditNotice = async () => {
    if (!selectedNotice) return
    
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch(`/api/hod/notices/${selectedNotice.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(editFormData),
      })
      
      if (res.ok) {
        setShowEditDialog(false)
        setSelectedNotice(null)
        fetchNotices()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update notice')
      }
    } catch (error) {
      console.error('Error updating notice:', error)
      alert('Failed to update notice')
    }
  }

  const handleDeleteNotice = async (noticeId: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return
    
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch(`/api/hod/notices/${noticeId}`, {
        method: 'DELETE',
        headers,
      })
      
      if (res.ok) {
        fetchNotices()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete notice')
      }
    } catch (error) {
      console.error('Error deleting notice:', error)
      alert('Failed to delete notice')
    }
  }

  const openEditDialog = (notice: Notice) => {
    setSelectedNotice(notice)
    setEditFormData({
      title: notice.title,
      content: notice.content,
      priority: notice.priority,
      isPinned: notice.isPinned,
    })
    setShowEditDialog(true)
  }

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      URGENT: 'bg-red-500/10 text-red-500 border-red-500/20',
      HIGH: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      NORMAL: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      LOW: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    }
    return (
      <Badge className={styles[priority] || styles.NORMAL}>
        {priority}
      </Badge>
    )
  }

  const columns = [
    {
      key: 'notice',
      header: 'Notice',
      render: (n: Notice) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="text-white font-medium">{n.title}</p>
            {n.isPinned && <Pin className="w-3 h-3 text-neon-lime" />}
          </div>
          <p className="text-white/50 text-sm line-clamp-1">{n.content}</p>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (n: Notice) => getPriorityBadge(n.priority),
    },
    {
      key: 'target',
      header: 'Target',
      render: (n: Notice) => (
        <div className="text-white/70 text-sm">
          {n.batch ? (
            <span>{n.batch.name}</span>
          ) : (
            <Badge variant="outline" className="text-xs">All Batches</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'postedBy',
      header: 'Posted By',
      render: (n: Notice) => (
        <div className="flex items-center gap-2 text-white/70">
          <User className="w-3 h-3" />
          <span className="text-sm">{n.postedBy.fullName}</span>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (n: Notice) => (
        <div className="text-white/50 text-sm">
          {new Date(n.createdAt).toLocaleDateString('en-IN')}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (n: Notice) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-white">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-charcoal border-white/10">
            <DropdownMenuItem
              onClick={() => openEditDialog(n)}
              className="text-white hover:bg-white/10 cursor-pointer"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDeleteNotice(n.id)}
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
          title="Notices"
          description="Manage department notices"
          actionLabel="Post Notice"
          onAction={() => setShowAddDialog(true)}
        />

        <Card className="bg-charcoal border-white/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-neon-lime" />
              <CardTitle className="text-white">Department Notices</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <HODFilterBar
              searchPlaceholder="Search notices..."
              searchValue=""
              onSearchChange={() => {}}
            />
            
            <HODDataTable
              columns={columns}
              data={notices}
              keyExtractor={(n) => n.id}
              loading={loadingData}
              emptyMessage="No notices found"
            />
          </CardContent>
        </Card>
      </div>

      {/* Add Notice Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-charcoal border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Post New Notice</DialogTitle>
            <DialogDescription className="text-white/50">
              Create a new notice for your department
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Notice title"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Content *</Label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Notice content"
                className="w-full h-32 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Batch</Label>
                <Select
                  value={formData.batchId}
                  onValueChange={(value) => setFormData({ ...formData, batchId: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="All batches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Batches</SelectItem>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isPinned}
                onCheckedChange={(checked) => setFormData({ ...formData, isPinned: checked })}
              />
              <Label className="mb-0">Pin this notice</Label>
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
                onClick={handleAddNotice}
                disabled={!formData.title || !formData.content}
                className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
              >
                Post Notice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Notice Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-charcoal border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Notice</DialogTitle>
            <DialogDescription className="text-white/50">
              Update notice details
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
              <Label>Content</Label>
              <textarea
                value={editFormData.content}
                onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                className="w-full h-32 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={editFormData.priority}
                onValueChange={(value) => setEditFormData({ ...editFormData, priority: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editFormData.isPinned}
                onCheckedChange={(checked) => setEditFormData({ ...editFormData, isPinned: checked })}
              />
              <Label className="mb-0">Pin this notice</Label>
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
                onClick={handleEditNotice}
                disabled={!editFormData.title || !editFormData.content}
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
