'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { getAuthHeaders } from '@/lib/api-helpers'
import { generateStudentListPDF, generateGradesPDF, generateFeeReportPDF, downloadPDF } from '@/lib/pdf-utils'
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

  const handleGenerateReport = async (reportType: string) => {
    setGenerating(reportType)
    const headers = await getAuthHeaders(firebaseUser)

    try {
      switch (reportType) {
        case 'Student List': {
          const res = await fetch('/api/hod/students', { headers })
          const students = await res.json()
          if (!students.length) {
            alert('No students found')
            break
          }
          const formatted = students.map((s: any) => ({
            id: s.id,
            name: s.fullName,
            email: s.email,
            rollNumber: s.studentId || '-',
            department: s.department?.name || user?.department?.name,
            batch: s.enrollments?.[0]?.batch?.name || '-'
          }))
          const doc = await generateStudentListPDF(formatted, 'Student List Report')
          await downloadPDF(doc, 'student_list_report')
          break
        }
        case 'Faculty List': {
          const res = await fetch('/api/hod/faculty', { headers })
          const faculty = await res.json()
          if (!faculty.length) {
            alert('No faculty found')
            break
          }
          const formatted = faculty.map((f: any) => ({
            id: f.id,
            name: f.fullName,
            email: f.email,
            department: f.department?.name
          }))
          const doc = await generateStudentListPDF(formatted, 'Faculty List Report')
          await downloadPDF(doc, 'faculty_list_report')
          break
        }
        case 'Subject List': {
          const res = await fetch('/api/admin/subjects', { headers })
          const subjects = await res.json()
          if (!subjects.length) {
            alert('No subjects found')
            break
          }
          const formatted = subjects.map((s: any) => ({
            id: s.id,
            name: s.name,
            code: s.code,
            department: s.department?.name,
            batch: s.batch?.name
          }))
          const doc = await generateStudentListPDF(formatted, 'Subject List Report')
          await downloadPDF(doc, 'subject_list_report')
          break
        }
        case 'Attendance Summary': {
          const res = await fetch('/api/hod/attendance', { headers })
          const attendance = await res.json()
          const attendanceData = (attendance || []).map((a: any) => ({
            studentName: a.student?.fullName || 'N/A',
            studentRoll: a.student?.rollNumber,
            subject: a.subject?.name || 'N/A',
            totalClasses: a.totalClasses || 0,
            present: a.present || 0,
            absent: a.absent || 0,
            percentage: a.percentage || 0
          }))
          const doc = await generateStudentListPDF(attendanceData, 'Attendance Report')
          await downloadPDF(doc, 'attendance_report')
          break
        }
        case 'Fee Collection Report': {
          const res = await fetch('/api/admin/fees', { headers })
          const fees = await res.json()
          if (!fees.length) {
            alert('No fee records found')
            break
          }
          const formatted = fees.map((f: any) => ({
            id: f.id,
            studentName: f.student?.fullName || 'N/A',
            studentRoll: f.student?.rollNumber,
            amount: f.amount || 0,
            status: f.status || 'PENDING',
            dueDate: f.dueDate,
            paidDate: f.paidDate
          }))
          const doc = await generateFeeReportPDF(formatted, 'Fee Collection Report')
          await downloadPDF(doc, 'fee_collection_report')
          break
        }
        case 'Department Performance': {
          const res = await fetch('/api/hod/stats', { headers })
          const data = await res.json()
          const performanceData = [
            { name: 'Total Students', email: data.totalStudents?.toString() || '0', rollNumber: '-', department: user?.department?.name, batch: '-' },
            { name: 'Total Faculty', email: data.totalFaculty?.toString() || '0', rollNumber: '-', department: user?.department?.name, batch: '-' },
            { name: 'Total Subjects', email: data.totalSubjects?.toString() || '0', rollNumber: '-', department: user?.department?.name, batch: '-' },
            { name: 'Total Batches', email: data.totalBatches?.toString() || '0', rollNumber: '-', department: user?.department?.name, batch: '-' },
          ]
          const doc = await generateStudentListPDF(performanceData, 'Department Performance Report')
          await downloadPDF(doc, 'department_performance_report')
          break
        }
        default:
          alert('Report type not implemented yet')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report')
    } finally {
      setGenerating(null)
    }
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
