"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { getAuthHeaders } from '@/lib/api-helpers'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bell, Pin, Plus, Trash2 } from 'lucide-react'

interface Notice {
  id: string
  title: string
  content: string
  priority: string
  isPinned: boolean
  department: { name: string } | null
  createdAt: string
}

interface Department {
  id: string
  name: string
}

export default function AdminNotices() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  const [notices, setNotices] = useState<Notice[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'NORMAL',
    departmentId: '',
    isPinned: false,
  })

  useEffect(() => {
    if (!loading && user && user.role !== 'PRINCIPAL' && user.role !== 'HOD') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'PRINCIPAL' || user?.role === 'HOD') {
      fetchNotices()
      fetchDepartments()
    }
  }, [user])

  const fetchNotices = async () => {
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/admin/notices', { headers })
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/admin/notices', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...formData,
          departmentId: formData.departmentId || null,
        }),
      })
      if (res.ok) {
        setFormData({ title: '', content: '', priority: 'NORMAL', departmentId: '', isPinned: false })
        setShowForm(false)
        fetchNotices()
      }
    } catch (error) {
      console.error('Error creating notice:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this notice?')) return
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch(`/api/admin/notices/${id}`, { method: 'DELETE', headers })
      if (res.ok) fetchNotices()
    } catch (error) {
      console.error('Error deleting notice:', error)
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT': return <Badge variant="destructive">Urgent</Badge>
      case 'HIGH': return <Badge variant="warning">High</Badge>
      case 'LOW': return <Badge variant="secondary">Low</Badge>
      default: return <Badge>Normal</Badge>
    }
  }

  if (loading || (user?.role !== 'PRINCIPAL' && user?.role !== 'HOD')) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Notices</h1>
            <p className="text-white/50 mt-1">Post and manage announcements</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Post Notice
          </Button>
        </div>

        {showForm && (
          <Card className="bg-charcoal border-white/5">
            <CardHeader>
              <CardTitle className="text-white">Post New Notice</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white/70">Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Notice title"
                    className="bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70">Content</Label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Notice content"
                    className="w-full h-32 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/70">Priority</Label>
                    <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                      <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Department</Label>
                    <Select value={formData.departmentId || 'all'} onValueChange={(v) => setFormData({ ...formData, departmentId: v === 'all' ? '' : v })}>
                      <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="All departments" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Options</Label>
                    <label className="flex items-center gap-2 text-white/70">
                      <input
                        type="checkbox"
                        checked={formData.isPinned}
                        onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                        className="w-4 h-4"
                      />
                      Pin this notice
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting} className="bg-neon-lime text-obsidian hover:bg-neon-lime/90">
                    {submitting ? 'Posting...' : 'Post Notice'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="border-white/10 text-white hover:bg-white/5">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="bg-charcoal border-white/5">
          <CardHeader>
            <CardTitle className="text-white">All Notices ({notices.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-neon-lime border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notices.length === 0 ? (
              <div className="text-center py-8 text-white/50">No notices posted yet</div>
            ) : (
              <div className="space-y-4">
                {notices.map((notice) => (
                  <div key={notice.id} className={`p-4 rounded-lg bg-white/5 border ${notice.isPinned ? 'border-neon-lime/30' : 'border-white/5'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {notice.isPinned && <Pin className="h-4 w-4 text-neon-lime" />}
                          <h3 className="text-white font-medium">{notice.title}</h3>
                          {getPriorityBadge(notice.priority)}
                        </div>
                        <p className="text-white/70 text-sm mt-2">{notice.content}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-white/50">
                          <span>{notice.department?.name || 'All Departments'}</span>
                          <span>{new Date(notice.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(notice.id)} className="text-red-500 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
