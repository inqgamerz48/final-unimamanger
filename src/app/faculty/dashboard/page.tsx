"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { getAuthHeaders } from '@/lib/api-helpers'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Calendar, FileText, Users } from 'lucide-react'

interface Stats {
  totalSubjects: number
  totalStudents: number
  pendingAssignments: number
  pendingGrading: number
}

export default function FacultyDashboard() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    totalSubjects: 0,
    totalStudents: 0,
    pendingAssignments: 0,
    pendingGrading: 0,
  })

  useEffect(() => {
    if (!loading && user && user.role !== 'FACULTY') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'FACULTY') {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const response = await fetch('/api/faculty/stats', { headers })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  if (loading || user?.role !== 'FACULTY') {
    return null
  }

  const statCards = [
    { title: 'My Subjects', value: stats.totalSubjects, icon: BookOpen, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { title: 'Enrolled Students', value: stats.totalStudents, icon: Users, color: 'text-green-500', bgColor: 'bg-green-500/10' },
    { title: 'Pending Assignments', value: stats.pendingAssignments, icon: FileText, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    { title: 'Pending Grading', value: stats.pendingGrading, icon: Calendar, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Welcome, {user.fullName}</h1>
          <p className="text-white/50 mt-1">Faculty Dashboard</p>
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
      </div>
    </DashboardLayout>
  )
}
