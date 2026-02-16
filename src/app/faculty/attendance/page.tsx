'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { getAuthHeaders } from '@/lib/api-helpers'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle, Save } from 'lucide-react'

interface Subject {
  id: string
  name: string
  code: string
  batchId: string
  batch: {
    name: string
  }
}

interface Student {
  id: string
  fullName: string
  studentId: string | null
  email: string
}

interface AttendanceRecord {
  id: string
  studentId: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
}

export default function FacultyAttendancePage() {
  const router = useRouter()
  const { user, firebaseUser, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<Student[]>([])

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])

  const [attendance, setAttendance] = useState<Record<string, string>>({})

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId)

  useEffect(() => {
    if (!authLoading && user && user.role !== 'FACULTY') {
      router.push('/')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user?.role === 'FACULTY') {
      fetchSubjects()
    }
  }, [user])

  const fetchSubjects = async () => {
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/faculty/subjects', { headers })
      if (res.ok) {
        const data = await res.json()
        setSubjects(data)
      }
    } catch (error) {
      console.error('Error loading subjects:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedSubjectId || !date) return

    const subject = subjects.find(s => s.id === selectedSubjectId)
    if (!subject) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const headers = await getAuthHeaders(firebaseUser)
        
        const studentsRes = await fetch(`/api/faculty/students?batchId=${subject.batchId}`, { headers })
        const studentsData = await studentsRes.json()

        if (studentsRes.ok) {
          setStudents(studentsData)

          const initialAttendance: Record<string, string> = {}
          studentsData.forEach((s: Student) => {
            initialAttendance[s.id] = 'PRESENT'
          })
          setAttendance(initialAttendance)
        }

        const attendanceRes = await fetch(
          `/api/faculty/attendance?batchId=${subject.batchId}&subjectId=${subject.id}&date=${date}`,
          { headers }
        )
        const attendanceData = await attendanceRes.json()

        if (attendanceRes.ok && Array.isArray(attendanceData)) {
          const existing: Record<string, string> = {}
          attendanceData.forEach((record: any) => {
            existing[record.studentId] = record.status
          })
          setAttendance(prev => ({ ...prev, ...existing }))
        }

      } catch (error) {
        console.error(error)
        toast.error('Error fetching data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedSubjectId, date, subjects, firebaseUser])

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }))
  }

  const handleMarkAll = (status: string) => {
    const newAttendance: Record<string, string> = {}
    students.forEach(s => {
      newAttendance[s.id] = status
    })
    setAttendance(newAttendance)
  }

  const handleSubmit = async () => {
    if (!selectedSubject) return

    setSaving(true)
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status
      }))

      const res = await fetch('/api/faculty/attendance', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: selectedSubject.batchId,
          subjectId: selectedSubject.id,
          date,
          records
        })
      })

      if (res.ok) {
        toast.success('Attendance saved successfully')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to save attendance')
      }
    } catch (error) {
      toast.error('Error saving attendance')
    } finally {
      setSaving(false)
    }
  }

  const StatusButton = ({
    studentId,
    status,
    currentStatus,
    icon: Icon,
    label,
    colorClass
  }: any) => {
    const isSelected = currentStatus === status
    return (
      <button
        onClick={() => handleStatusChange(studentId, status)}
        className={`flex items-center justify-center p-2 rounded-md transition-all ${
          isSelected
            ? `${colorClass} text-white shadow-md`
            : 'bg-white/5 text-white/50 hover:bg-white/10'
        }`}
        title={label}
      >
        <Icon className="w-4 h-4" />
      </button>
    )
  }

  if (authLoading || user?.role !== 'FACULTY') {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Mark Attendance</h1>
            <p className="text-white/50 mt-1">Select a subject and date to mark student attendance.</p>
          </div>
          {selectedSubjectId && (
            <Button onClick={handleSubmit} disabled={saving || loading} className="bg-neon-lime text-obsidian hover:bg-neon-lime/90">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Attendance
            </Button>
          )}
        </div>

        <Card className="bg-charcoal border-white/5">
          <CardHeader>
            <CardTitle className="text-white">Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">Subject</label>
                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent className="bg-charcoal border-white/10">
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id} className="text-white">
                        {subject.name} ({subject.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">Date</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              {selectedSubject && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Batch</label>
                  <div className="p-2 border border-white/10 rounded-md bg-white/5 text-white">
                    {selectedSubject.batch.name}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedSubjectId ? (
          <Card className="bg-charcoal border-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Student List ({students.length})</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleMarkAll('PRESENT')} className="border-white/10 text-white hover:bg-white/10">
                  Mark All Present
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleMarkAll('ABSENT')} className="border-white/10 text-white hover:bg-white/10">
                  Mark All Absent
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-8 h-8 animate-spin text-neon-lime" />
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-8 text-white/50">
                  No students found in this batch.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-white/70 border-b border-white/10">
                    <div className="col-span-5">Student Details</div>
                    <div className="col-span-7 flex justify-between px-2">
                      <span>Present</span>
                      <span>Absent</span>
                      <span>Late</span>
                      <span>Excused</span>
                    </div>
                  </div>

                  {students.map(student => (
                    <div key={student.id} className="grid grid-cols-12 gap-4 items-center p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                      <div className="col-span-5">
                        <p className="font-medium text-white">{student.fullName}</p>
                        <p className="text-xs text-white/50">{student.studentId || 'No ID'}</p>
                      </div>
                      <div className="col-span-7 grid grid-cols-4 gap-2">
                        <StatusButton
                          studentId={student.id}
                          status="PRESENT"
                          currentStatus={attendance[student.id]}
                          icon={CheckCircle2}
                          label="Present"
                          colorClass="bg-green-500 hover:bg-green-600"
                        />
                        <StatusButton
                          studentId={student.id}
                          status="ABSENT"
                          currentStatus={attendance[student.id]}
                          icon={XCircle}
                          label="Absent"
                          colorClass="bg-red-500 hover:bg-red-600"
                        />
                        <StatusButton
                          studentId={student.id}
                          status="LATE"
                          currentStatus={attendance[student.id]}
                          icon={Clock}
                          label="Late"
                          colorClass="bg-yellow-500 hover:bg-yellow-600"
                        />
                        <StatusButton
                          studentId={student.id}
                          status="EXCUSED"
                          currentStatus={attendance[student.id]}
                          icon={AlertCircle}
                          label="Excused"
                          colorClass="bg-blue-500 hover:bg-blue-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-charcoal rounded-lg border border-white/5">
            <Clock className="w-12 h-12 text-white/50 mb-4" />
            <p className="text-lg font-medium text-white">Select a subject to start marking attendance</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
