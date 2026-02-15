"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'

interface Complaint {
  id: string
  title: string
  description: string
  status: string
  createdAt: string
  student: { fullName: string; studentId: string | null }
}

export default function AdminComplaints() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [filter, setFilter] = useState('all')

  const getAuthHeaders = () => {
    if (!firebaseUser) return { 'Content-Type': 'application/json' }
    return {
      'x-firebase-uid': firebaseUser.uid,
      'Content-Type': 'application/json',
    }
  }

  useEffect(() => {
    if (!loading && user && user.role !== 'PRINCIPAL' && user.role !== 'HOD') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'PRINCIPAL' || user?.role === 'HOD') {
      fetchComplaints()
    }
  }, [user])

  const fetchComplaints = async () => {
    try {
      const res = await fetch('/api/admin/complaints', { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setComplaints(data)
      }
    } catch (error) {
      console.error('Error fetching complaints:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleResolve = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/complaints/${id}/resolve`, { method: 'POST', headers: getAuthHeaders() })
      if (res.ok) fetchComplaints()
    } catch (error) {
      console.error('Error resolving complaint:', error)
    }
  }

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/complaints/${id}/reject`, { method: 'POST', headers: getAuthHeaders() })
      if (res.ok) fetchComplaints()
    } catch (error) {
      console.error('Error rejecting complaint:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="warning">Pending</Badge>
      case 'IN_PROGRESS': return <Badge variant="secondary">In Progress</Badge>
      case 'RESOLVED': return <Badge variant="success">Resolved</Badge>
      case 'REJECTED': return <Badge variant="destructive">Rejected</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-5 w-5 text-yellow-500" />
      case 'IN_PROGRESS': return <AlertCircle className="h-5 w-5 text-blue-500" />
      case 'RESOLVED': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'REJECTED': return <XCircle className="h-5 w-5 text-red-500" />
      default: return <Clock className="h-5 w-5" />
    }
  }

  if (loading || (user?.role !== 'PRINCIPAL' && user?.role !== 'HOD')) {
    return null
  }

  const filteredComplaints = complaints.filter(c => filter === 'all' || c.status === filter)
  const counts = { all: complaints.length, PENDING: complaints.filter(c => c.status === 'PENDING').length, IN_PROGRESS: complaints.filter(c => c.status === 'IN_PROGRESS').length, RESOLVED: complaints.filter(c => c.status === 'RESOLVED').length }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Complaints</h1>
          <p className="text-white/50 mt-1">Resolve student complaints</p>
        </div>

        <div className="flex gap-2">
          {['all', 'PENDING', 'IN_PROGRESS', 'RESOLVED'].map((f) => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)} className={filter === f ? 'bg-neon-lime text-obsidian' : 'border-white/10 text-white'}>
              {f === 'all' ? 'All' : f.replace('_', ' ')} ({counts[f as keyof typeof counts]})
            </Button>
          ))}
        </div>

        <Card className="bg-charcoal border-white/5">
          <CardHeader><CardTitle className="text-white">Complaint List</CardTitle></CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="flex items-center justify-center py-8"><div className="w-8 h-8 border-2 border-neon-lime border-t-transparent rounded-full animate-spin" /></div>
            ) : filteredComplaints.length === 0 ? (
              <div className="text-center py-8 text-white/50">No complaints found</div>
            ) : (
              <div className="space-y-4">
                {filteredComplaints.map((complaint) => (
                  <div key={complaint.id} className="p-4 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(complaint.status)}
                          <h3 className="text-white font-medium">{complaint.title}</h3>
                          {getStatusBadge(complaint.status)}
                        </div>
                        <p className="text-white/70 text-sm mt-2">{complaint.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-white/50">
                          <span>By: {complaint.student.fullName} ({complaint.student.studentId || 'N/A'})</span>
                          <span>{new Date(complaint.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                      {complaint.status === 'PENDING' && (
                        <div className="flex gap-2 ml-4">
                          <Button size="sm" onClick={() => handleResolve(complaint.id)} className="bg-green-500 hover:bg-green-600">Resolve</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReject(complaint.id)}>Reject</Button>
                        </div>
                      )}
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
