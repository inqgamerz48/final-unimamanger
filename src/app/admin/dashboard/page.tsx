"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Building2, BookOpen, Calendar, Bell, DollarSign } from 'lucide-react'

interface Stats {
  totalStudents: number
  totalFaculty: number
  totalDepartments: number
  totalSubjects: number
}

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalFaculty: 0,
    totalDepartments: 0,
    totalSubjects: 0,
  })

  useEffect(() => {
    if (!loading && user && user.role !== 'PRINCIPAL') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'PRINCIPAL') {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  if (loading || user?.role !== 'PRINCIPAL') {
    return null
  }

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Faculty',
      value: stats.totalFaculty,
      icon: Building2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Departments',
      value: stats.totalDepartments,
      icon: BookOpen,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Subjects',
      value: stats.totalSubjects,
      icon: Calendar,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-white">Welcome, {user.fullName}</h1>
          <p className="text-white/50 mt-1">Principal Dashboard - Overview of your institution</p>
        </div>

        {/* Stats Grid */}
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-charcoal border-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="h-5 w-5 text-neon-lime" />
                Recent Notices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/50 text-sm">View and manage recent announcements</p>
            </CardContent>
          </Card>

          <Card className="bg-charcoal border-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-neon-lime" />
                Fee Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/50 text-sm">Track fee payments and pending dues</p>
            </CardContent>
          </Card>

          <Card className="bg-charcoal border-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-neon-lime" />
                Pending Complaints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/50 text-sm">Review and resolve student complaints</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
