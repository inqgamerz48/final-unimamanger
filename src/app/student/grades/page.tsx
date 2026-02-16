"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { getAuthHeaders } from '@/lib/api-helpers'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clipboard, TrendingUp, Award } from 'lucide-react'

interface Grade {
  id: string
  marks: number
  totalMarks: number
  examType: string
  subject: {
    name: string
    code: string
  }
}

export default function StudentGrades() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  const [grades, setGrades] = useState<Grade[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && user && user.role !== 'STUDENT') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'STUDENT') {
      fetchGrades()
    }
  }, [user])

  const fetchGrades = async () => {
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/student/grades', { headers })
      if (res.ok) {
        const data = await res.json()
        setGrades(data)
      }
    } catch (error) {
      console.error('Error fetching grades:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-500'
    if (percentage >= 80) return 'text-blue-500'
    if (percentage >= 70) return 'text-yellow-500'
    if (percentage >= 60) return 'text-orange-500'
    return 'text-red-500'
  }

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return 'A+'
    if (percentage >= 80) return 'A'
    if (percentage >= 70) return 'B+'
    if (percentage >= 60) return 'B'
    if (percentage >= 50) return 'C'
    return 'F'
  }

  if (loading || user?.role !== 'STUDENT') {
    return null
  }

  const allGrades = grades.flatMap(g => 
    Array.from({ length: Math.ceil(g.totalMarks / 10) }, (_, i) => ({
      ...g,
      position: i + 1
    }))
  )

  const overallPercentage = grades.length > 0
    ? Math.round(grades.reduce((sum, g) => sum + (g.marks / g.totalMarks * 100), 0) / grades.length)
    : 0

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">My Grades</h1>
          <p className="text-white/50 mt-1">View your academic performance</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-charcoal border-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Overall Percentage</p>
                  <p className={`text-3xl font-bold mt-1 ${getGradeColor(overallPercentage)}`}>{overallPercentage}%</p>
                </div>
                <TrendingUp className="h-10 w-10 text-neon-lime" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-charcoal border-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Current Grade</p>
                  <p className={`text-3xl font-bold mt-1 ${getGradeColor(overallPercentage)}`}>{getGrade(overallPercentage)}</p>
                </div>
                <Award className="h-10 w-10 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-charcoal border-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Exams Completed</p>
                  <p className="text-3xl font-bold text-white mt-1">{grades.length}</p>
                </div>
                <Clipboard className="h-10 w-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grades Table */}
        <Card className="bg-charcoal border-white/5">
          <CardHeader>
            <CardTitle className="text-white">Grade Details</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-neon-lime border-t-transparent rounded-full animate-spin" />
              </div>
            ) : grades.length === 0 ? (
              <div className="text-center py-8 text-white/50">
                No grades available yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Subject</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Code</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Exam Type</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Marks</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Percentage</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((grade) => {
                      const percentage = Math.round((grade.marks / grade.totalMarks) * 100)
                      return (
                        <tr key={grade.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 px-4 text-white">{grade.subject.name}</td>
                          <td className="py-3 px-4 text-white/70">{grade.subject.code}</td>
                          <td className="py-3 px-4 text-white">{grade.examType}</td>
                          <td className="py-3 px-4 text-white font-medium">{grade.marks}/{grade.totalMarks}</td>
                          <td className={`py-3 px-4 font-medium ${getGradeColor(percentage)}`}>{percentage}%</td>
                          <td className={`py-3 px-4 font-bold ${getGradeColor(percentage)}`}>{getGrade(percentage)}</td>
                        </tr>
                      )
                    })}
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
