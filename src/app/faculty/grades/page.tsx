"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GraduationCap, Users, Save, Trash2, Plus, Award, BookOpen } from 'lucide-react'

interface Subject {
  id: string
  name: string
  code: string
  batch: { name: string; id: string }
  department: { name: string }
}

interface Student {
  id: string
  fullName: string
  studentId: string | null
}

interface Grade {
  id: string
  marks: number
  totalMarks: number
  examType: string
  studentId: string
  subjectId: string
  student: {
    id: string
    fullName: string
    studentId: string | null
  }
  subject: {
    id: string
    name: string
    code: string
  }
}

const EXAM_TYPES = ['MST1', 'MST2', 'FINAL'] as const

export default function FacultyGrades() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [selectedExamType, setSelectedExamType] = useState<string>('MST1')
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [gradeInputs, setGradeInputs] = useState<Record<string, { marks: string; totalMarks: string }>>({})

  useEffect(() => {
    if (!loading && user && user.role !== 'FACULTY' && user.role !== 'HOD') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'FACULTY' || user?.role === 'HOD') {
      fetchGradesData()
    }
  }, [user])

  useEffect(() => {
    if (selectedSubject) {
      fetchStudentsForSubject(selectedSubject)
    }
  }, [selectedSubject])

  const getAuthHeaders = () => {
    if (!firebaseUser) return {}
    return {
      'x-firebase-uid': firebaseUser.uid,
      'Content-Type': 'application/json',
    }
  }

  const fetchGradesData = async () => {
    try {
      const res = await fetch('/api/faculty/grades', {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setSubjects(data.subjects)
        setGrades(data.grades)
        if (data.subjects.length > 0 && !selectedSubject) {
          setSelectedSubject(data.subjects[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching grades:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const fetchStudentsForSubject = async (subjectId: string) => {
    try {
      const res = await fetch(`/api/faculty/subjects/${subjectId}/students`, {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setStudents(data)
        // Initialize grade inputs
        const inputs: Record<string, { marks: string; totalMarks: string }> = {}
        data.forEach((student: Student) => {
          const existingGrade = grades.find(
            g => g.studentId === student.id && 
                 g.subjectId === subjectId && 
                 g.examType === selectedExamType
          )
          inputs[student.id] = {
            marks: existingGrade ? existingGrade.marks.toString() : '',
            totalMarks: existingGrade ? existingGrade.totalMarks.toString() : '100'
          }
        })
        setGradeInputs(inputs)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const handleSaveGrade = async (studentId: string) => {
    const input = gradeInputs[studentId]
    if (!input || !input.marks) return

    setSaving(true)
    try {
      const res = await fetch('/api/faculty/grades', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          studentId,
          subjectId: selectedSubject,
          examType: selectedExamType,
          marks: parseInt(input.marks),
          totalMarks: parseInt(input.totalMarks) || 100,
        }),
      })

      if (res.ok) {
        const newGrade = await res.json()
        // Update local grades state
        setGrades(prev => {
          const filtered = prev.filter(
            g => !(g.studentId === studentId && 
                   g.subjectId === selectedSubject && 
                   g.examType === selectedExamType)
          )
          return [...filtered, newGrade]
        })
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save grade')
      }
    } catch (error) {
      console.error('Error saving grade:', error)
      alert('Failed to save grade')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteGrade = async (gradeId: string, studentId: string) => {
    if (!confirm('Are you sure you want to delete this grade?')) return

    try {
      const res = await fetch(`/api/faculty/grades?id=${gradeId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (res.ok) {
        setGrades(prev => prev.filter(g => g.id !== gradeId))
        // Clear the input for this student
        setGradeInputs(prev => ({
          ...prev,
          [studentId]: { marks: '', totalMarks: '100' }
        }))
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete grade')
      }
    } catch (error) {
      console.error('Error deleting grade:', error)
      alert('Failed to delete grade')
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

  const selectedSubjectData = subjects.find(s => s.id === selectedSubject)

  if (loading || (user?.role !== 'FACULTY' && user?.role !== 'HOD')) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Grade Management</h1>
          <p className="text-white/50 mt-1">Enter and manage student grades</p>
        </div>

        {/* Controls */}
        <Card className="bg-charcoal border-white/5">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/70">Subject</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name} ({subject.code}) - {subject.batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Exam Type</Label>
                <Select value={selectedExamType} onValueChange={setSelectedExamType}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXAM_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subject Info */}
        {selectedSubjectData && (
          <Card className="bg-charcoal border-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-neon-lime/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-neon-lime" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-lg">{selectedSubjectData.name}</h3>
                  <p className="text-white/50">
                    {selectedSubjectData.code} • {selectedSubjectData.batch.name} • {selectedSubjectData.department.name}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Students Table */}
        <Card className="bg-charcoal border-white/5">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Student Grades - {selectedExamType}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-neon-lime border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !selectedSubject ? (
              <div className="text-center py-8 text-white/50">
                Select a subject to view students
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-white/50">
                No students enrolled in this subject
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Student</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Student ID</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Marks</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Out of</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">%</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Grade</th>
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      const input = gradeInputs[student.id] || { marks: '', totalMarks: '100' }
                      const marks = parseInt(input.marks) || 0
                      const total = parseInt(input.totalMarks) || 100
                      const percentage = total > 0 ? Math.round((marks / total) * 100) : 0
                      const hasGrade = input.marks !== ''

                      return (
                        <tr key={student.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 px-4 text-white font-medium">{student.fullName}</td>
                          <td className="py-3 px-4 text-white/70">{student.studentId || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <Input
                              type="number"
                              min="0"
                              max={input.totalMarks || 100}
                              value={input.marks}
                              onChange={(e) => setGradeInputs(prev => ({
                                ...prev,
                                [student.id]: { ...prev[student.id], marks: e.target.value }
                              }))}
                              className="w-20 bg-white/5 border-white/10 text-white"
                              placeholder="0"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              type="number"
                              min="1"
                              value={input.totalMarks}
                              onChange={(e) => setGradeInputs(prev => ({
                                ...prev,
                                [student.id]: { ...prev[student.id], totalMarks: e.target.value }
                              }))}
                              className="w-20 bg-white/5 border-white/10 text-white"
                              placeholder="100"
                            />
                          </td>
                          <td className={`py-3 px-4 font-medium ${hasGrade ? getGradeColor(percentage) : 'text-white/30'}`}>
                            {hasGrade ? `${percentage}%` : '-'}
                          </td>
                          <td className={`py-3 px-4 font-bold ${hasGrade ? getGradeColor(percentage) : 'text-white/30'}`}>
                            {hasGrade ? getGrade(percentage) : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveGrade(student.id)}
                                disabled={saving || !input.marks}
                                className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              {hasGrade && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const grade = grades.find(
                                      g => g.studentId === student.id && 
                                           g.subjectId === selectedSubject && 
                                           g.examType === selectedExamType
                                    )
                                    if (grade) handleDeleteGrade(grade.id, student.id)
                                  }}
                                  className="text-red-500 hover:text-red-400"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {selectedSubject && students.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {EXAM_TYPES.map((examType) => {
              const examGrades = grades.filter(
                g => g.subjectId === selectedSubject && g.examType === examType
              )
              const avgMarks = examGrades.length > 0
                ? Math.round(examGrades.reduce((sum, g) => sum + (g.marks / g.totalMarks * 100), 0) / examGrades.length)
                : 0

              return (
                <Card key={examType} className="bg-charcoal border-white/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/50">{examType}</p>
                        <p className={`text-2xl font-bold mt-1 ${avgMarks > 0 ? getGradeColor(avgMarks) : 'text-white/30'}`}>
                          {avgMarks > 0 ? `${avgMarks}%` : 'N/A'}
                        </p>
                        <p className="text-xs text-white/50 mt-1">
                          {examGrades.length} of {students.length} graded
                        </p>
                      </div>
                      <Award className="h-8 w-8 text-white/20" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
