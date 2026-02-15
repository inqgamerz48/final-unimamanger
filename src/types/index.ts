export type Role = 'PRINCIPAL' | 'HOD' | 'FACULTY' | 'STUDENT'

export interface User {
  id: string
  firebaseUid: string
  email: string
  fullName: string
  role: Role
  departmentId?: string | null
  department?: Department | null
  isActive: boolean
  phone?: string | null
  studentId?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Department {
  id: string
  name: string
  code: string
  hodId?: string | null
  hod?: User | null
  createdAt: Date
  updatedAt: Date
}

export interface Batch {
  id: string
  name: string
  year: number
  semester: number
  departmentId: string
  department?: Department
  createdAt: Date
  updatedAt: Date
}

export interface Subject {
  id: string
  name: string
  code: string
  departmentId: string
  department?: Department
  batchId: string
  batch?: Batch
  facultyId?: string | null
  faculty?: User | null
  createdAt: Date
  updatedAt: Date
}

export interface Enrollment {
  id: string
  studentId: string
  student?: User
  batchId: string
  batch?: Batch
  academicYear: string
  createdAt: Date
  updatedAt: Date
}

export interface Assignment {
  id: string
  title: string
  description?: string | null
  subjectId: string
  subject?: Subject
  dueDate: Date
  createdById: string
  createdBy?: User
  createdAt: Date
  updatedAt: Date
}

export interface Submission {
  id: string
  assignmentId: string
  assignment?: Assignment
  studentId: string
  student?: User
  fileUrl?: string | null
  submittedAt: Date
  marks?: number | null
  feedback?: string | null
  gradedById?: string | null
  gradedBy?: User | null
  gradedAt?: Date | null
}

export interface Attendance {
  id: string
  studentId: string
  student?: User
  subjectId: string
  subject?: Subject
  date: Date
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  markedById?: string | null
  markedBy?: User | null
  createdAt: Date
  updatedAt: Date
}

export interface Notice {
  id: string
  title: string
  content: string
  postedById: string
  postedBy?: User
  departmentId?: string | null
  department?: Department | null
  batchId?: string | null
  batch?: Batch | null
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Complaint {
  id: string
  title: string
  description: string
  studentId: string
  student?: User
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED'
  resolvedById?: string | null
  resolvedBy?: User | null
  resolvedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Fee {
  id: string
  studentId: string
  student?: User
  amount: number
  dueDate: Date
  status: 'PENDING' | 'PAID' | 'OVERDUE'
  paidAt?: Date | null
  description?: string | null
  academicYear: string
  createdAt: Date
  updatedAt: Date
}

export interface CollegeSettings {
  id: string
  collegeName: string
  collegeCode: string
  logoUrl?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  updatedAt: Date
}
