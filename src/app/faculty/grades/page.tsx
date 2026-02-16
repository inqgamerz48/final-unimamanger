'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Save, Search } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Subject {
  id: string
  name: string
  code: string
  batchId: string
  batch: { name: string }
}

interface Student {
  id: string
  fullName: string
  studentId: string
}

interface Grade {
  studentId: string
  marks: number
  totalMarks: number
}

export default function FacultyGradesPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [selectedExamType, setSelectedExamType] = useState<string>('MST1')
  const [students, setStudents] = useState<Student[]>([])
  const [grades, setGrades] = useState<Record<string, number>>({}) // studentId -> marks
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Fetch subjects on load
  useEffect(() => {
    fetch('/api/faculty/subjects')
      .then(res => res.json())
      .then(data => setSubjects(data))
      .catch(err => console.error(err))
  }, [])

  // Fetch students & existing grades when Subject/Exam changes
  useEffect(() => {
    if (!selectedSubject) return

    const loadData = async () => {
      setLoading(true)
      try {
        const subject = subjects.find(s => s.id === selectedSubject)
        if (!subject) return

        // 1. Fetch Students in batch
        const studentsRes = await fetch(`/api/faculty/students?batchId=${subject.batchId}`)
        const studentsData = await studentsRes.json()

        // 2. Fetch Existing Grades
        const gradesRes = await fetch(`/api/faculty/grades?subjectId=${selectedSubject}&examType=${selectedExamType}`)
        const gradesData = await gradesRes.json()

        setStudents(studentsData)

        // Map existing grades
        const gradeMap: Record<string, number> = {}
        if (Array.isArray(gradesData)) {
          gradesData.forEach((g: any) => {
            gradeMap[g.studentId] = g.marks
          })
        }
        setGrades(gradeMap)

      } catch (error) {
        console.error(error)
        toast.error('Failed to load students/grades')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedSubject, selectedExamType, subjects])

  const handleGradeChange = (studentId: string, value: string) => {
    // Allow empty or number
    if (value === '') {
      const newGrades = { ...grades }
      delete newGrades[studentId]
      setGrades(newGrades)
      return
    }
    const num = parseInt(value)
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setGrades(prev => ({ ...prev, [studentId]: num }))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        subjectId: selectedSubject,
        examType: selectedExamType,
        grades: Object.entries(grades).map(([studentId, marks]) => ({
          studentId,
          marks,
          totalMarks: 100 // Default to 100 for now
        }))
      }

      const res = await fetch('/api/faculty/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success('Grades saved successfully')
      } else {
        toast.error('Failed to save grades')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error saving grades')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-white">Grade Entry</h1>
          <p className="text-white/50 mt-1">Record marks for MSTs and Finals</p>
        </div>

        <Card className="bg-charcoal border-white/5">
          <CardHeader>
            <CardTitle className="text-white text-lg">Selection</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label className="text-white/70">Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.code}) - {s.batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48 space-y-2">
              <Label className="text-white/70">Exam Type</Label>
              <Select value={selectedExamType} onValueChange={setSelectedExamType}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MST1">MST 1</SelectItem>
                  <SelectItem value="MST2">MST 2</SelectItem>
                  <SelectItem value="FINAL">Final</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedSubject && (
          <Card className="bg-charcoal border-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Student List ({students.length})</CardTitle>
              <Button
                onClick={handleSave}
                disabled={saving || students.length === 0}
                className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Grades
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-8 h-8 text-neon-lime animate-spin" />
                </div>
              ) : (
                <div className="border border-white/5 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-white/70 uppercase">
                      <tr>
                        <th className="px-4 py-3">Student ID</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3 w-32 text-center">Marks (100)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {students.map(student => (
                        <tr key={student.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-white/70">{student.studentId}</td>
                          <td className="px-4 py-3 text-white font-medium">{student.fullName}</td>
                          <td className="px-4 py-2 text-center">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={grades[student.id] ?? ''}
                              onChange={(e) => handleGradeChange(student.id, e.target.value)}
                              className="w-20 mx-auto text-center bg-black/20 border-white/10 text-white"
                              placeholder="-"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {students.length === 0 && (
                    <div className="p-8 text-center text-white/50">No students found in this batch.</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
