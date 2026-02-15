import { z } from 'zod'

// User validation schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['PRINCIPAL', 'HOD', 'FACULTY', 'STUDENT']),
  departmentId: z.string().optional(),
  phone: z.string().optional(),
  studentId: z.string().optional(),
})

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  role: z.enum(['PRINCIPAL', 'HOD', 'FACULTY', 'STUDENT']).optional(),
  departmentId: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  studentId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

// Department validation schemas
export const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters').max(100),
  code: z.string().min(2, 'Code must be at least 2 characters').max(10).toUpperCase(),
  hodId: z.string().optional(),
})

export const updateDepartmentSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  code: z.string().min(2).max(10).toUpperCase().optional(),
  hodId: z.string().optional().nullable(),
})

// Batch validation schemas
export const createBatchSchema = z.object({
  name: z.string().min(2).max(50),
  year: z.number().int().min(1).max(10),
  semester: z.number().int().min(1).max(12),
  departmentId: z.string(),
})

// Subject validation schemas
export const createSubjectSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(20).toUpperCase(),
  departmentId: z.string(),
  batchId: z.string(),
  facultyId: z.string().optional(),
})

// Notice validation schemas
export const createNoticeSchema = z.object({
  title: z.string().min(2).max(200),
  content: z.string().min(10).max(5000),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  departmentId: z.string().optional(),
  batchId: z.string().optional(),
})

// Assignment validation schemas
export const createAssignmentSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  subjectId: z.string(),
  dueDate: z.string().datetime(),
})

// Grade validation schemas
export const createGradeSchema = z.object({
  studentId: z.string(),
  subjectId: z.string(),
  examType: z.enum(['MST1', 'MST2', 'FINAL']),
  marks: z.number().int().min(0),
  totalMarks: z.number().int().min(1).default(100),
})

// Complaint validation schemas
export const createComplaintSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
})

// Fee validation schemas
export const createFeeSchema = z.object({
  studentId: z.string(),
  amount: z.number().positive('Amount must be positive'),
  dueDate: z.string().datetime(),
  feeType: z.enum(['TUITION', 'EXAM', 'LIBRARY', 'HOSTEL', 'TRANSPORT', 'LAB', 'MISCELLANEOUS']),
  description: z.string().max(500).optional(),
  academicYear: z.string(),
})

export const updateFeeSchema = z.object({
  amount: z.number().positive().optional(),
  dueDate: z.string().datetime().optional(),
  feeType: z.enum(['TUITION', 'EXAM', 'LIBRARY', 'HOSTEL', 'TRANSPORT', 'LAB', 'MISCELLANEOUS']).optional(),
  description: z.string().max(500).optional().nullable(),
  academicYear: z.string().optional(),
})

export const markFeePaidSchema = z.object({
  status: z.enum(['PAID', 'PARTIALLY_PAID', 'WAIVED']),
  amountPaid: z.number().min(0).optional(),
  paymentMode: z.enum(['CASH', 'BANK_TRANSFER', 'ONLINE', 'CHEQUE', 'UPI']).optional(),
  remarks: z.string().max(1000).optional(),
})

export const bulkCreateFeeSchema = z.object({
  batchId: z.string().optional(),
  departmentId: z.string().optional(),
  amount: z.number().positive(),
  dueDate: z.string().datetime(),
  feeType: z.enum(['TUITION', 'EXAM', 'LIBRARY', 'HOSTEL', 'TRANSPORT', 'LAB', 'MISCELLANEOUS']),
  description: z.string().max(500).optional(),
  academicYear: z.string(),
})

// Attendance validation schemas
export const markAttendanceSchema = z.object({
  subjectId: z.string(),
  date: z.string().datetime(),
  records: z.record(z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'])),
})

// Settings validation schemas
export const updateSettingsSchema = z.object({
  bio: z.string().max(500).optional(),
  notifications: z.boolean().optional(),
  emailAlerts: z.boolean().optional(),
  feeReminders: z.boolean().optional(),
  theme: z.enum(['dark', 'light', 'auto']).optional(),
  language: z.string().optional(),
})

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  bio: z.string().max(500).optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const updateCollegeSettingsSchema = z.object({
  collegeName: z.string().min(2).max(100).optional(),
  collegeCode: z.string().min(2).max(20).optional(),
  logoUrl: z.string().url().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  academicYear: z.string().optional(),
})

// Setup validation schemas
export const setupCollegeSchema = z.object({
  collegeName: z.string().min(2).max(100),
  collegeCode: z.string().min(2).max(20),
  address: z.string().max(500).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  academicYear: z.string(),
  logoUrl: z.string().url().optional(),
})

export const setupDepartmentSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(10).toUpperCase(),
})

export const setupHodSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const setupFacultySchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})
