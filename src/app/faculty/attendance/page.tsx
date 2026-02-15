"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, XCircle, Clock, Users, Calendar } from 'lucide-react'

interface Student {
  id: string
  fullName: string
  studentId: string | null
}

interface Subject {
  id: string
  name: string
  code: string
  batch: {
    name: string
  }
}

interface AttendanceRecord {
  studentId: string
  status: string
}

export default function FacultyAttendance() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [attendance, setAttendance] = useState<Record<string, string>>({})
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const getAuthHeaders = () => {
    if (!firebaseUser) return { 'Content-Type': 'application/json' }
    return {
      'x-firebase-uid': firebaseUser.uid,
      'Content-Type': 'application/json',
    }
  }

  useEffect(() => {
    if (!loading && user && user.role !== 'FACULTY') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'FACULTY') {
      fetchSubjects()
    }
  }, [user])

  useEffect(() => {
    if (selectedSubject) {
      fetchStudents()
    }
  }, [selectedSubject])

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/faculty/subjects', { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setSubjects(data)
      }
    } catch (error) {
      console.error('Error fetching subjects:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const res = await fetch(`/api/faculty/subjects/${selectedSubject}/students`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setStudents(data)
        setAttendance({})
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }))
  }

  const handleMarkAll = (status: string) => {
    const newAttendance: Record<string, string> = {}
    students.forEach(s => { newAttendance[s.id] = status })
    setAttendance(newAttendance)
  }

  const handleSave = async () => {
    if (!selectedSubject || Object.keys(attendance).length === 0) return

    setSaving(true)
    try {
      const res = await fetch('/api/faculty/attendance', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          subjectId: selectedSubject,
          date: new Date(date),
          records: attendance,
        }),
      })
      if (res.ok) {
        alert('Attendance marked successfully!')
        setAttendance({})
      } else {
        alert('Failed to save attendance')
      }
    } catch (error) {
      console.error('Error saving attendance:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading || user?.role !== 'FACULTY') {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Mark Attendance</h1>
          <p className="text-white/50 mt-1">Select subject and mark student attendance</p>
        </div>

        {/* Controls */}
        <Card className="bg-charcoal border-white/5">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-white/70 text-sm mb-2 block">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm mb-2 block">Subject</label>
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
              <div>
                <label className="text-white/70 text-sm mb-2 block">Quick Actions</label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAll('PRESENT')}
                    className="border-white/10 text-white hover:bg-white/5"
                  >
                    All Present
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAll('ABSENT')}
                    className="border-white/10 text-white hover:bg-white/5"
                  >
                    All Absent
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student List */}
        {selectedSubject && (
          <Card className="bg-charcoal border-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Students ({students.length})</span>
                <Button
                  onClick={handleSave}
                  disabled={saving || Object.keys(attendance).length === 0}
                  className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
                >
                  {saving ? 'Saving...' : 'Save Attendance'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-8 text-white/50">
                  No students enrolled in this subject
                </div>
              ) : (
                <div className="space-y-2">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div>
                        <p className="text-white font-medium">{student.fullName}</p>
                        <p className="text-white/50 text-sm">{student.studentId || 'No ID'}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant={attendance[student.id] === 'PRESENT' ? 'default' : 'outline'}
                          onClick={() => handleStatusChange(student.id, 'PRESENT')}
                          className={attendance[student.id] === 'PRESENT' ? 'bg-green-500' : 'border-white/10 text-white hover:bg-white/5'}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={attendance[student.id] === 'ABSENT' ? 'default' : 'outline'}
                          onClick={() => handleStatusChange(student.id, 'ABSENT')}
                          className={attendance[student.id] === 'ABSENT' ? 'bg-red-500' : 'border-white/10 text-white hover:bg-white/5'}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={attendance[student.id] === 'LATE' ? 'default' : 'outline'}
                          onClick={() => handleStatusChange(student.id, 'LATE')}
                          className={attendance[student.id] === 'LATE' ? 'bg-yellow-500' : 'border-white/10 text-white hover:bg-white/5'}
                        >
                          <Clock className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
