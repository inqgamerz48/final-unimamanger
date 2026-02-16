'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle, Save } from 'lucide-react'

// Types based on our API responses
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Data
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<Student[]>([])

  // Selection State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])

  // Attendance State: Map studentId -> status
  const [attendance, setAttendance] = useState<Record<string, string>>({})

  // Derived state
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId)

  // 1. Fetch Subjects on Mount
  useEffect(() => {
    fetch('/api/faculty/subjects')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSubjects(data)
        } else {
          toast.error('Failed to load subjects')
        }
      })
      .catch(err => toast.error('Error loading subjects'))
      .finally(() => setLoading(false))
  }, [])

  // 2. Fetch Students & Existing Attendance when Subject/Date changes
  useEffect(() => {
    if (!selectedSubjectId || !date) return

    const subject = subjects.find(s => s.id === selectedSubjectId)
    if (!subject) return

    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch Students for the batch
        const studentsRes = await fetch(`/api/faculty/students?batchId=${subject.batchId}`)
        const studentsData = await studentsRes.json()

        if (studentsRes.ok) {
          setStudents(studentsData)

          // Initialize attendance with 'PRESENT' for all new students
          const initialAttendance: Record<string, string> = {}
          studentsData.forEach((s: Student) => {
            initialAttendance[s.id] = 'PRESENT'
          })
          setAttendance(initialAttendance)
        } else {
          toast.error('Failed to load students')
          return
        }

        // Fetch Existing Attendance
        const attendanceRes = await fetch(
          `/api/faculty/attendance?batchId=${subject.batchId}&subjectId=${subject.id}&date=${date}`
        )
        const attendanceData = await attendanceRes.json()

        if (attendanceRes.ok && Array.isArray(attendanceData)) {
          // Update state with existing records
          const existing: Record<string, string> = {}
          attendanceData.forEach((record: any) => {
            existing[record.studentId] = record.status
          })
          // Merge: existing overrides initial 'PRESENT'
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
  }, [selectedSubjectId, date, subjects])

  // Handlers
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
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status
      }))

      const res = await fetch('/api/faculty/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // Helper for Status Badge/Button
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
        className={`
          flex items-center justify-center p-2 rounded-md transition-all
          ${isSelected
            ? `${colorClass} text-white shadow-md`
            : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
          }
        `}
        title={label}
      >
        <Icon className="w-4 h-4" />
      </button>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mark Attendance</h1>
          <p className="text-muted-foreground">Select a subject and date to mark student attendance.</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedSubjectId && (
            <Button onClick={handleSubmit} disabled={saving || loading} className="bg-neon-lime text-obsidian hover:bg-neon-lime/90">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Attendance
            </Button>
          )}
        </div>
      </div>

      {/* Filters Card */}
      <Card className="bg-card">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {selectedSubject && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Batch</label>
                <div className="p-2 border rounded-md bg-muted/50 text-sm">
                  {selectedSubject.batch.name}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      {selectedSubjectId ? (
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Student List ({students.length})</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleMarkAll('PRESENT')}>Mark All Present</Button>
              <Button variant="outline" size="sm" onClick={() => handleMarkAll('ABSENT')}>Mark All Absent</Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No students found in this batch.
              </div>
            ) : (
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
                  <div className="col-span-5">Student Details</div>
                  <div className="col-span-7 flex justify-between px-2">
                    <span>Present</span>
                    <span>Absent</span>
                    <span>Late</span>
                    <span>Excused</span>
                  </div>
                </div>

                {/* Rows */}
                {students.map(student => (
                  <div key={student.id} className="grid grid-cols-12 gap-4 items-center p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                    <div className="col-span-5">
                      <p className="font-medium">{student.fullName}</p>
                      <p className="text-xs text-muted-foreground">{student.studentId || 'No ID'}</p>
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
        <div className="flex flex-col items-center justify-center p-12 bg-muted/10 rounded-lg border border-dashed">
          <Clock className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Select a subject to start marking attendance</p>
        </div>
      )}
    </div>
  )
}
