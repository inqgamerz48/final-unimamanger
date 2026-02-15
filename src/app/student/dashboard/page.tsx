"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { getAuthHeaders } from '@/lib/api-helpers'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Calendar, FileText, DollarSign, Bell, AlertCircle } from 'lucide-react'

interface Stats {
  enrolledSubjects: number
  attendance: number
  pendingAssignments: number
  feeDue: number
  notices: number
  complaints: number
}

export default function StudentDashboard() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    enrolledSubjects: 0,
    attendance: 0,
    pendingAssignments: 0,
    feeDue: 0,
    notices: 0,
    complaints: 0,
  })

  useEffect(() => {
    if (!loading && user && user.role !== 'STUDENT') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'STUDENT') {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const response = await fetch('/api/student/stats', { headers })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  if (loading || user?.role !== 'STUDENT') {
    return null
  }

  const statCards = [
    { title: 'Enrolled Subjects', value: stats.enrolledSubjects, icon: BookOpen, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { title: 'Attendance', value: `${stats.attendance}%`, icon: Calendar, color: 'text-green-500', bgColor: 'bg-green-500/10' },
    { title: 'Pending Assignments', value: stats.pendingAssignments, icon: FileText, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    { title: 'Fee Due', value: `₹${stats.feeDue}`, icon: DollarSign, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Welcome, {user.fullName}</h1>
          <p className="text-white/50 mt-1">
            Student ID: {user.studentId || 'Not Assigned'} | {user.department?.name || 'No Department'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="bg-charcoal border-white/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/50">{stat.title}</p>
                      <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                    </div>
                    <div className={`h-12 w-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-charcoal border-white/5 cursor-pointer hover:bg-white/5 transition-colors">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Bell className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-white">{stats.notices} New Notices</p>
                <p className="text-sm text-white/50">View announcements</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-charcoal border-white/5 cursor-pointer hover:bg-white/5 transition-colors">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="font-medium text-white">{stats.complaints} Active Complaints</p>
                <p className="text-sm text-white/50">Track status</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-charcoal border-white/5 cursor-pointer hover:bg-white/5 transition-colors">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-white">Fee Status</p>
                <p className="text-sm text-white/50">View & pay fees</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
