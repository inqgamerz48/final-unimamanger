"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { getAuthHeaders } from '@/lib/api-helpers'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'

interface AttendanceRecord {
  id: string
  date: string
  status: string
  subject: {
    name: string
    code: string
  }
}

export default function StudentAttendance() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && user && user.role !== 'STUDENT') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'STUDENT') {
      fetchAttendance()
    }
  }, [user])

  const fetchAttendance = async () => {
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/student/attendance', { headers })
      if (res.ok) {
        const data = await res.json()
        setAttendance(data)
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'ABSENT':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'LATE':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <Badge variant="success">Present</Badge>
      case 'ABSENT':
        return <Badge variant="destructive">Absent</Badge>
      case 'LATE':
        return <Badge variant="warning">Late</Badge>
      case 'EXCUSED':
        return <Badge>Excused</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (loading || user?.role !== 'STUDENT') {
    return null
  }

  const totalClasses = attendance.length
  const presentClasses = attendance.filter(a => a.status === 'PRESENT').length
  const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">My Attendance</h1>
          <p className="text-white/50 mt-1">View your attendance records</p>
        </div>

        {/* Attendance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-charcoal border-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Overall Attendance</p>
                  <p className="text-3xl font-bold text-white mt-1">{attendancePercentage}%</p>
                </div>
                <Calendar className="h-10 w-10 text-neon-lime" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-charcoal border-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Classes Attended</p>
                  <p className="text-3xl font-bold text-green-500 mt-1">{presentClasses}</p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-charcoal border-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Classes Missed</p>
                  <p className="text-3xl font-bold text-red-500 mt-1">{totalClasses - presentClasses}</p>
                </div>
                <XCircle className="h-10 w-10 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Records */}
        <Card className="bg-charcoal border-white/5">
          <CardHeader>
            <CardTitle className="text-white">Attendance History</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-neon-lime border-t-transparent rounded-full animate-spin" />
              </div>
            ) : attendance.length === 0 ? (
              <div className="text-center py-8 text-white/50">
                No attendance records found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Date</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Subject</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Code</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((record) => (
                      <tr key={record.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4 text-white">{new Date(record.date).toLocaleDateString('en-IN')}</td>
                        <td className="py-3 px-4 text-white">{record.subject.name}</td>
                        <td className="py-3 px-4 text-white/70">{record.subject.code}</td>
                        <td className="py-3 px-4">{getStatusBadge(record.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
