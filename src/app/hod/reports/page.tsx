'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { getAuthHeaders } from '@/lib/api-helpers'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { HODPageHeader } from '@/components/hod/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Download, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar,
  TrendingUp,
  DollarSign
} from 'lucide-react'

interface ReportCardProps {
  title: string
  description: string
  icon: React.ReactNode
  onGenerate: () => void
  loading?: boolean
}

function ReportCard({ title, description, icon, onGenerate, loading }: ReportCardProps) {
  return (
    <Card className="bg-charcoal border-white/5 hover:border-white/10 transition-colors">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-neon-lime/10 flex items-center justify-center">
              {icon}
            </div>
            <div>
              <h3 className="text-white font-medium">{title}</h3>
              <p className="text-white/50 text-sm">{description}</p>
            </div>
          </div>
          <Button
            onClick={onGenerate}
            disabled={loading}
            variant="outline"
            size="sm"
            className="border-white/10 text-white hover:bg-white/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Generate
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function HODReportsPage() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  
  const [generating, setGenerating] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    if (!loading && user && user.role !== 'HOD') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'HOD') {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/hod/stats', { headers })
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleGenerateReport = (reportType: string) => {
    setGenerating(reportType)
    
    // Simulate report generation
    setTimeout(() => {
      alert(`${reportType} report generated successfully!`)
      setGenerating(null)
    }, 1500)
  }

  const reports = [
    {
      id: 'student-list',
      title: 'Student List',
      description: 'Complete list of all students in your department',
      icon: <Users className="h-5 w-5 text-neon-lime" />,
    },
    {
      id: 'faculty-list',
      title: 'Faculty List',
      description: 'Complete list of all faculty members',
      icon: <GraduationCap className="h-5 w-5 text-neon-lime" />,
    },
    {
      id: 'subject-list',
      title: 'Subject List',
      description: 'All subjects with assigned faculty',
      icon: <BookOpen className="h-5 w-5 text-neon-lime" />,
    },
    {
      id: 'attendance-summary',
      title: 'Attendance Summary',
      description: 'Department-wide attendance statistics',
      icon: <Calendar className="h-5 w-5 text-neon-lime" />,
    },
    {
      id: 'fee-report',
      title: 'Fee Collection Report',
      description: 'Fee collection summary for the department',
      icon: <DollarSign className="h-5 w-5 text-neon-lime" />,
    },
    {
      id: 'performance',
      title: 'Department Performance',
      description: 'Overall department performance metrics',
      icon: <TrendingUp className="h-5 w-5 text-neon-lime" />,
    },
  ]

  if (loading || user?.role !== 'HOD') {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <HODPageHeader
          title="Reports"
          description="View and generate department reports"
          showAction={false}
        />

        {/* Department Overview */}
        {stats && (
          <Card className="bg-charcoal border-white/5">
            <CardHeader>
              <CardTitle className="text-white">Department Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                  <p className="text-sm text-white/50">Total Students</p>
                  <p className="text-2xl font-bold text-white">{stats.totalStudents}</p>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                  <p className="text-sm text-white/50">Total Faculty</p>
                  <p className="text-2xl font-bold text-white">{stats.totalFaculty}</p>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                  <p className="text-sm text-white/50">Subjects</p>
                  <p className="text-2xl font-bold text-white">{stats.totalSubjects}</p>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                  <p className="text-sm text-white/50">Batches</p>
                  <p className="text-2xl font-bold text-white">{stats.totalBatches}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Reports */}
        <Card className="bg-charcoal border-white/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-neon-lime" />
              <CardTitle className="text-white">Available Reports</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  title={report.title}
                  description={report.description}
                  icon={report.icon}
                  onGenerate={() => handleGenerateReport(report.title)}
                  loading={generating === report.title}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="bg-charcoal border-white/5">
          <CardHeader>
            <CardTitle className="text-white">Quick Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
                <div>
                  <p className="text-white font-medium">Student-Faculty Ratio</p>
                  <p className="text-white/50 text-sm">
                    {stats ? `${stats.totalStudents} : ${stats.totalFaculty}` : 'Loading...'}
                  </p>
                </div>
                <Badge className="bg-green-500/10 text-green-500">
                  Good
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
                <div>
                  <p className="text-white font-medium">Department Status</p>
                  <p className="text-white/50 text-sm">
                    {stats?.departmentName || 'Department'}
                  </p>
                </div>
                <Badge className="bg-blue-500/10 text-blue-500">
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
