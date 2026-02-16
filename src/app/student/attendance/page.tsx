'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface AttendanceRecord {
  id: string
  date: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  subject: {
    name: string
    code: string
  }
}

export default function StudentAttendancePage() {
  const [loading, setLoading] = useState(true)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])

  useEffect(() => {
    fetch('/api/student/attendance')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAttendance(data)
        } else {
          console.error(data)
          toast.error('Failed to load attendance')
        }
      })
      .catch(err => toast.error('Error loading attendance'))
      .finally(() => setLoading(false))
  }, [])

  // Calculate Stats
  const total = attendance.length
  const present = attendance.filter(r => r.status === 'PRESENT').length
  const absent = attendance.filter(r => r.status === 'ABSENT').length
  const late = attendance.filter(r => r.status === 'LATE').length
  const excused = attendance.filter(r => r.status === 'EXCUSED').length

  // Assuming Late counts as Present for basic % calculation, or user might want specific rules.
  // For now: (Present + Late) / Total
  const effectivePresent = present + late
  const percentage = total > 0 ? Math.round((effectivePresent / total) * 100) : 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
      case 'ABSENT': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
      case 'LATE': return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
      case 'EXCUSED': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
      default: return 'bg-gray-500/10 text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT': return <CheckCircle2 className="w-4 h-4 mr-1" />
      case 'ABSENT': return <XCircle className="w-4 h-4 mr-1" />
      case 'LATE': return <Clock className="w-4 h-4 mr-1" />
      case 'EXCUSED': return <AlertCircle className="w-4 h-4 mr-1" />
      default: return null
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
        <p className="text-muted-foreground">Track your attendance and history.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-neon-lime">{percentage}%</span>
            <span className="text-sm text-muted-foreground mt-2">Overall Attendance</span>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-white">{total}</span>
            <span className="text-sm text-muted-foreground mt-2">Total Classes</span>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-green-500">{present}</span>
            <span className="text-sm text-muted-foreground mt-2">Present</span>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-red-500">{absent}</span>
            <span className="text-sm text-muted-foreground mt-2">Absent</span>
          </CardContent>
        </Card>
      </div>

      {/* History List */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : attendance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No attendance records found.</div>
          ) : (
            <div className="space-y-4">
              {attendance.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
                  <div>
                    <p className="font-medium text-white">{record.subject.name}</p>
                    <p className="text-sm text-muted-foreground">{new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  </div>
                  <Badge variant="outline" className={`${getStatusColor(record.status)} border-0 flex items-center px-3 py-1`}>
                    {getStatusIcon(record.status)}
                    {record.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
