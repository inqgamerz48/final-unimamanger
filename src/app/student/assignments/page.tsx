"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Clock, CheckCircle, Upload, AlertCircle } from 'lucide-react'

interface Assignment {
  id: string
  title: string
  description: string | null
  dueDate: string
  subject: {
    name: string
    code: string
  }
  submission?: {
    id: string
    submittedAt: string
    marks: number | null
    feedback: string | null
  } | null
}

export default function StudentAssignments() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (firebaseUser?.uid) {
      headers['x-firebase-uid'] = firebaseUser.uid
    }
    return headers
  }

  useEffect(() => {
    if (!loading && user && user.role !== 'STUDENT') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'STUDENT') {
      fetchAssignments()
    }
  }, [user])

  const fetchAssignments = async () => {
    try {
      const res = await fetch('/api/student/assignments', { headers: getAuthHeaders() })
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

  const handleSubmit = async (assignmentId: string) => {
    setSubmitting(assignmentId)
    try {
      const res = await fetch(`/api/student/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        fetchAssignments()
      } else {
        alert('Failed to submit assignment')
      }
    } catch (error) {
      console.error('Error submitting:', error)
    } finally {
      setSubmitting(null)
    }
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  if (loading || user?.role !== 'STUDENT') {
    return null
  }

  const pendingAssignments = assignments.filter(a => !a.submission)
  const submittedAssignments = assignments.filter(a => a.submission)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">My Assignments</h1>
          <p className="text-white/50 mt-1">View and submit your assignments</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-charcoal border-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Pending</p>
                  <p className="text-3xl font-bold text-orange-500 mt-1">{pendingAssignments.length}</p>
                </div>
                <Clock className="h-10 w-10 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-charcoal border-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Submitted</p>
                  <p className="text-3xl font-bold text-green-500 mt-1">{submittedAssignments.length}</p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-charcoal border-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Overdue</p>
                  <p className="text-3xl font-bold text-red-500 mt-1">
                    {pendingAssignments.filter(a => isOverdue(a.dueDate)).length}
                  </p>
                </div>
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignments List */}
        <Card className="bg-charcoal border-white/5">
          <CardHeader>
            <CardTitle className="text-white">All Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-neon-lime border-t-transparent rounded-full animate-spin" />
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-8 text-white/50">
                No assignments found
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="p-4 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-medium">{assignment.title}</h3>
                          {assignment.submission ? (
                            <Badge variant="success">Submitted</Badge>
                          ) : isOverdue(assignment.dueDate) ? (
                            <Badge variant="destructive">Overdue</Badge>
                          ) : (
                            <Badge variant="warning">Pending</Badge>
                          )}
                        </div>
                        <p className="text-white/50 text-sm mt-1">{assignment.subject.name} ({assignment.subject.code})</p>
                        {assignment.description && (
                          <p className="text-white/70 text-sm mt-2">{assignment.description}</p>
                        )}
                        
                        {assignment.submission && (
                          <div className="mt-3 p-3 rounded bg-green-500/10 border border-green-500/20">
                            <p className="text-green-400 text-sm">
                              Submitted on {new Date(assignment.submission.submittedAt).toLocaleDateString('en-IN')}
                            </p>
                            {assignment.submission.marks !== null && (
                              <p className="text-white text-sm mt-1">
                                Marks: {assignment.submission.marks}
                                {assignment.submission.feedback && ` - ${assignment.submission.feedback}`}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        {!assignment.submission && !isOverdue(assignment.dueDate) && (
                          <Button
                            onClick={() => handleSubmit(assignment.id)}
                            disabled={submitting === assignment.id}
                            className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
                          >
                            {submitting === assignment.id ? (
                              <div className="w-4 h-4 border-2 border-obsidian border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Submit
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center text-sm text-white/50">
                      <Clock className="w-4 h-4 mr-1" />
                      Due: {new Date(assignment.dueDate).toLocaleDateString('en-IN')}
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
