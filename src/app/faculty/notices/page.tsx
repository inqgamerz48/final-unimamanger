'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { getAuthHeaders } from '@/lib/api-helpers'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Bell, Pin, Clock, Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Notice {
  id: string
  title: string
  content: string
  priority: string
  isPinned: boolean
  createdAt: string
  postedBy: {
    fullName: string
  }
  department?: {
    name: string
  }
}

interface Department {
  id: string
  name: string
  code: string
}

export default function FacultyNotices() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  const [notices, setNotices] = useState<Notice[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'NORMAL',
    departmentId: ''
  })

  useEffect(() => {
    if (!loading && user && user.role !== 'FACULTY' && user.role !== 'HOD' && user.role !== 'PRINCIPAL') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'FACULTY' || user?.role === 'HOD' || user?.role === 'PRINCIPAL') {
      fetchNotices()
      fetchDepartments()
    }
  }, [user])

  const fetchNotices = async () => {
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/faculty/notices', { headers })
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

  const fetchDepartments = async () => {
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/admin/departments', { headers })
      if (res.ok) {
        const data = await res.json()
        setDepartments(data)
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const handleCreate = async () => {
    if (!formData.title || !formData.content) {
      toast.error('Title and content are required')
      return
    }

    setSubmitting(true)
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/faculty/notices', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        toast.success('Notice posted successfully')
        setShowCreateDialog(false)
        setFormData({ title: '', content: '', priority: 'NORMAL', departmentId: '' })
        fetchNotices()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to post notice')
      }
    } catch (error) {
      console.error('Error creating notice:', error)
      toast.error('Failed to post notice')
    } finally {
      setSubmitting(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-500/10 text-red-500'
      case 'URGENT': return 'bg-orange-500/10 text-orange-500'
      case 'LOW': return 'bg-blue-500/10 text-blue-500'
      default: return 'bg-yellow-500/10 text-yellow-500'
    }
  }

  if (loading || (user?.role !== 'FACULTY' && user?.role !== 'HOD' && user?.role !== 'PRINCIPAL')) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Notices</h1>
            <p className="text-white/50 mt-1">View and create notices</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-neon-lime text-obsidian hover:bg-neon-lime/90">
                <Plus className="w-4 h-4 mr-2" />
                Post Notice
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-charcoal border-white/10 text-white">
              <DialogHeader>
                <DialogTitle>Post New Notice</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-white/70">Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Notice title"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70">Content</Label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Notice content"
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-md p-3 text-white resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70">Priority</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-charcoal border-white/10">
                      <SelectItem value="LOW" className="text-white">Low</SelectItem>
                      <SelectItem value="NORMAL" className="text-white">Normal</SelectItem>
                      <SelectItem value="HIGH" className="text-white">High</SelectItem>
                      <SelectItem value="URGENT" className="text-white">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" onClick={() => setShowCreateDialog(false)} className="text-white">Cancel</Button>
                  <Button onClick={handleCreate} disabled={submitting} className="bg-neon-lime text-obsidian">
                    {submitting ? 'Posting...' : 'Post Notice'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-charcoal border-white/5">
          <CardHeader>
            <CardTitle className="text-white">All Notices</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-neon-lime border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notices.length === 0 ? (
              <div className="text-center py-8 text-white/50">No notices yet</div>
            ) : (
              <div className="space-y-4">
                {notices.map((notice) => (
                  <div
                    key={notice.id}
                    className={`p-4 rounded-lg border ${
                      notice.isPinned ? 'bg-neon-lime/5 border-neon-lime/20' : 'bg-white/5 border-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {notice.isPinned && <Pin className="w-4 h-4 text-neon-lime mt-1" />}
                        <div>
                          <h3 className="font-medium text-white">{notice.title}</h3>
                          <p className="text-sm text-white/50 mt-1">{notice.content}</p>
                        </div>
                      </div>
                      <Badge className={getPriorityColor(notice.priority)}>
                        {notice.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-white/50">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(notice.createdAt).toLocaleDateString()}
                      </span>
                      <span>By {notice.postedBy.fullName}</span>
                      {notice.department && <span>{notice.department.name}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
