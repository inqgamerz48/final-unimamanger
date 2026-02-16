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
import { Badge } from '@/components/ui/badge'
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, Users } from 'lucide-react'

interface Batch {
  id: string
  name: string
  year: number
  semester: number
}

interface AttendanceStats {
  totalAttendance: number
  presentCount: number
  absentCount: number
  lateCount: number
  excusedCount: number
  attendanceRate: string
}

interface AttendanceRecord {
  id: string
  date: string
  status: string
  student: { fullName: string; studentId: string | null }
  subject: { name: string; code: string }
  markedBy: { fullName: string } | null
}

export default function HODAttendancePage() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [batches, setBatches] = useState<Batch[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [selectedBatch, setSelectedBatch] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (!loading && user && user.role !== 'HOD') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'HOD') {
      fetchBatches()
      fetchAttendance()
    }
  }, [user, selectedBatch, selectedDate])

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

  const fetchAttendance = async () => {
    try {
      setLoadingData(true)
      const headers = await getAuthHeaders(firebaseUser)
      const queryParams = new URLSearchParams()
      queryParams.append('date', selectedDate)
      if (selectedBatch) queryParams.append('batchId', selectedBatch)
      
      const res = await fetch(`/api/hod/attendance?${queryParams}`, { headers })
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setAttendance(data.recentAttendance)
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <Badge className="bg-green-500/10 text-green-500">Present</Badge>
      case 'ABSENT':
        return <Badge className="bg-red-500/10 text-red-500">Absent</Badge>
      case 'LATE':
        return <Badge className="bg-yellow-500/10 text-yellow-500">Late</Badge>
      case 'EXCUSED':
        return <Badge className="bg-blue-500/10 text-blue-500">Excused</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'ABSENT':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'LATE':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'EXCUSED':
        return <AlertCircle className="w-4 h-4 text-blue-500" />
      default:
        return null
    }
  }

  const batchFilterOptions = batches.map(b => ({
    value: b.id,
    label: `${b.name} (Year ${b.year}, Sem ${b.semester})`,
  }))

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (a: AttendanceRecord) => (
        <div>
          <p className="text-white font-medium">{a.student.fullName}</p>
          <p className="text-white/50 text-sm">{a.student.studentId || 'No ID'}</p>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (a: AttendanceRecord) => (
        <div className="text-white/70">
          <p className="font-medium">{a.subject.name}</p>
          <p className="text-white/50 text-sm">{a.subject.code}</p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (a: AttendanceRecord) => (
        <div className="text-white/70 text-sm">
          {new Date(a.date).toLocaleDateString('en-IN')}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a: AttendanceRecord) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(a.status)}
          {getStatusBadge(a.status)}
        </div>
      ),
    },
    {
      key: 'markedBy',
      header: 'Marked By',
      render: (a: AttendanceRecord) => (
        <div className="text-white/50 text-sm">
          {a.markedBy?.fullName || 'System'}
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
          title="Attendance"
          description="Monitor department attendance"
          showAction={false}
        />

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-charcoal border-white/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/50">Attendance Rate</p>
                    <p className="text-2xl font-bold text-white">{stats.attendanceRate}%</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-neon-lime/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-neon-lime" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-charcoal border-white/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/50">Present</p>
                    <p className="text-2xl font-bold text-green-500">{stats.presentCount}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-charcoal border-white/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/50">Absent</p>
                    <p className="text-2xl font-bold text-red-500">{stats.absentCount}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-charcoal border-white/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/50">Late / Excused</p>
                    <p className="text-2xl font-bold text-yellow-500">{stats.lateCount + stats.excusedCount}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="bg-charcoal border-white/5">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-white/50" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                />
              </div>
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
            </div>
          </CardContent>
        </Card>

        {/* Attendance Records */}
        <Card className="bg-charcoal border-white/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-neon-lime" />
              <CardTitle className="text-white">Recent Attendance Records</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <HODDataTable
              columns={columns}
              data={attendance}
              keyExtractor={(a) => a.id}
              loading={loadingData}
              emptyMessage="No attendance records found for selected date"
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
