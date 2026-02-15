"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, FileText, Clock } from 'lucide-react'

interface Subject {
  id: string
  name: string
  code: string
  batch: {
    name: string
  }
}

export default function FacultyAssignments() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    subjectId: '',
    title: '',
    description: '',
    dueDate: '',
  })

  const getAuthHeaders = () => {
    if (!firebaseUser) return { 'Content-Type': 'application/json' }
    return {
      'x-firebase-uid': firebaseUser.uid,
      'Content-Type': 'application/json',
    }
  }

  useEffect(() => {
    if (!loading && user && user.role !== 'FACULTY') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'FACULTY') {
      fetchSubjects()
    }
  }, [user])

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/faculty/subjects', { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setSubjects(data)
      }
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/faculty/assignments', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setFormData({ subjectId: '', title: '', description: '', dueDate: '' })
        setShowForm(false)
        alert('Assignment created successfully!')
      }
    } catch (error) {
      console.error('Error creating assignment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || user?.role !== 'FACULTY') {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Assignments</h1>
            <p className="text-white/50 mt-1">Create and manage assignments</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Assignment
          </Button>
        </div>

        {showForm && (
          <Card className="bg-charcoal border-white/5">
            <CardHeader>
              <CardTitle className="text-white">Create New Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/70">Subject</Label>
                    <Select
                      value={formData.subjectId}
                      onValueChange={(v) => setFormData({ ...formData, subjectId: v })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} ({s.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Due Date</Label>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70">Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Assignment title"
                    className="bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70">Description</Label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Assignment description"
                    className="w-full h-32 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
                  >
                    {submitting ? 'Creating...' : 'Create Assignment'}
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

        <Card className="bg-charcoal border-white/5">
          <CardHeader>
            <CardTitle className="text-white">Your Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            {subjects.length === 0 ? (
              <div className="text-center py-8 text-white/50">
                No subjects assigned to you
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map((subject) => (
                  <div key={subject.id} className="p-4 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-neon-lime/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-neon-lime" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{subject.name}</h3>
                        <p className="text-white/50 text-sm">{subject.code} • {subject.batch.name}</p>
                      </div>
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
