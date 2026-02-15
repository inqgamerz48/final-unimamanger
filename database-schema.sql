-- =====================================================
-- UNI Manager Database Schema
-- PostgreSQL SQL Dump
-- Run this in your Neon/PostgreSQL SQL Editor
-- =====================================================

-- Create Enum Types
CREATE TYPE "Role" AS ENUM ('PRINCIPAL', 'HOD', 'FACULTY', 'STUDENT');
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');
CREATE TYPE "ExamType" AS ENUM ('MST1', 'MST2', 'FINAL');
CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "ComplaintStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED');
CREATE TYPE "FeeStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE');

-- Create User Table
CREATE TABLE "User" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "firebaseUid" TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    "fullName" TEXT NOT NULL,
    role "Role" DEFAULT 'STUDENT',
    "departmentId" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    phone TEXT,
    "studentId" TEXT UNIQUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Department Table
CREATE TABLE "Department" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    "hodId" TEXT UNIQUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Batch Table
CREATE TABLE "Batch" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    year INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("departmentId", year, semester)
);

-- Create Subject Table
CREATE TABLE "Subject" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "facultyId" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(code, "batchId")
);

-- Create Enrollment Table
CREATE TABLE "Enrollment" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "studentId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("studentId", "batchId")
);

-- Create Assignment Table
CREATE TABLE "Assignment" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT,
    "subjectId" TEXT NOT NULL,
    "dueDate" TIMESTAMP NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Submission Table
CREATE TABLE "Submission" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fileUrl" TEXT,
    "submittedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    marks INTEGER,
    feedback TEXT,
    "gradedById" TEXT,
    "gradedAt" TIMESTAMP,
    UNIQUE("assignmentId", "studentId")
);

-- Create Attendance Table
CREATE TABLE "Attendance" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    date TIMESTAMP NOT NULL,
    status "AttendanceStatus" DEFAULT 'PRESENT',
    "markedById" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("studentId", "subjectId", date)
);

-- Create Grade Table
CREATE TABLE "Grade" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "examType" "ExamType" NOT NULL,
    marks INTEGER NOT NULL,
    "totalMarks" INTEGER DEFAULT 100,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("studentId", "subjectId", "examType")
);

-- Create Notice Table
CREATE TABLE "Notice" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    "postedById" TEXT NOT NULL,
    "departmentId" TEXT,
    "batchId" TEXT,
    priority "Priority" DEFAULT 'NORMAL',
    "isPinned" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Complaint Table
CREATE TABLE "Complaint" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    status "ComplaintStatus" DEFAULT 'PENDING',
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Fee Table
CREATE TABLE "Fee" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "studentId" TEXT NOT NULL,
    amount FLOAT NOT NULL,
    "dueDate" TIMESTAMP NOT NULL,
    status "FeeStatus" DEFAULT 'PENDING',
    "paidAt" TIMESTAMP,
    description TEXT,
    "academicYear" TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create CollegeSettings Table
CREATE TABLE "CollegeSettings" (
    id TEXT PRIMARY KEY DEFAULT 'default',
    "collegeName" TEXT DEFAULT 'My College',
    "collegeCode" TEXT DEFAULT 'UNI',
    "logoUrl" TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Create Foreign Key Constraints
-- =====================================================

-- User Foreign Keys
ALTER TABLE "User" ADD CONSTRAINT fk_user_department 
    FOREIGN KEY ("departmentId") REFERENCES "Department"(id) ON DELETE SET NULL;

-- Department Foreign Keys
ALTER TABLE "Department" ADD CONSTRAINT fk_department_hod 
    FOREIGN KEY ("hodId") REFERENCES "User"(id) ON DELETE SET NULL;

-- Batch Foreign Keys
ALTER TABLE "Batch" ADD CONSTRAINT fk_batch_department 
    FOREIGN KEY ("departmentId") REFERENCES "Department"(id) ON DELETE CASCADE;

-- Subject Foreign Keys
ALTER TABLE "Subject" ADD CONSTRAINT fk_subject_department 
    FOREIGN KEY ("departmentId") REFERENCES "Department"(id) ON DELETE CASCADE;
ALTER TABLE "Subject" ADD CONSTRAINT fk_subject_batch 
    FOREIGN KEY ("batchId") REFERENCES "Batch"(id) ON DELETE CASCADE;
ALTER TABLE "Subject" ADD CONSTRAINT fk_subject_faculty 
    FOREIGN KEY ("facultyId") REFERENCES "User"(id) ON DELETE SET NULL;

-- Enrollment Foreign Keys
ALTER TABLE "Enrollment" ADD CONSTRAINT fk_enrollment_student 
    FOREIGN KEY ("studentId") REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT fk_enrollment_batch 
    FOREIGN KEY ("batchId") REFERENCES "Batch"(id) ON DELETE CASCADE;

-- Assignment Foreign Keys
ALTER TABLE "Assignment" ADD CONSTRAINT fk_assignment_subject 
    FOREIGN KEY ("subjectId") REFERENCES "Subject"(id) ON DELETE CASCADE;
ALTER TABLE "Assignment" ADD CONSTRAINT fk_assignment_creator 
    FOREIGN KEY ("createdById") REFERENCES "User"(id) ON DELETE CASCADE;

-- Submission Foreign Keys
ALTER TABLE "Submission" ADD CONSTRAINT fk_submission_assignment 
    FOREIGN KEY ("assignmentId") REFERENCES "Assignment"(id) ON DELETE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT fk_submission_student 
    FOREIGN KEY ("studentId") REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT fk_submission_grader 
    FOREIGN KEY ("gradedById") REFERENCES "User"(id) ON DELETE SET NULL;

-- Attendance Foreign Keys
ALTER TABLE "Attendance" ADD CONSTRAINT fk_attendance_student 
    FOREIGN KEY ("studentId") REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT fk_attendance_subject 
    FOREIGN KEY ("subjectId") REFERENCES "Subject"(id) ON DELETE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT fk_attendance_marker 
    FOREIGN KEY ("markedById") REFERENCES "User"(id) ON DELETE SET NULL;

-- Grade Foreign Keys
ALTER TABLE "Grade" ADD CONSTRAINT fk_grade_student 
    FOREIGN KEY ("studentId") REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "Grade" ADD CONSTRAINT fk_grade_subject 
    FOREIGN KEY ("subjectId") REFERENCES "Subject"(id) ON DELETE CASCADE;

-- Notice Foreign Keys
ALTER TABLE "Notice" ADD CONSTRAINT fk_notice_poster 
    FOREIGN KEY ("postedById") REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "Notice" ADD CONSTRAINT fk_notice_department 
    FOREIGN KEY ("departmentId") REFERENCES "Department"(id) ON DELETE SET NULL;
ALTER TABLE "Notice" ADD CONSTRAINT fk_notice_batch 
    FOREIGN KEY ("batchId") REFERENCES "Batch"(id) ON DELETE SET NULL;

-- Complaint Foreign Keys
ALTER TABLE "Complaint" ADD CONSTRAINT fk_complaint_student 
    FOREIGN KEY ("studentId") REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "Complaint" ADD CONSTRAINT fk_complaint_resolver 
    FOREIGN KEY ("resolvedById") REFERENCES "User"(id) ON DELETE SET NULL;

-- Fee Foreign Keys
ALTER TABLE "Fee" ADD CONSTRAINT fk_fee_student 
    FOREIGN KEY ("studentId") REFERENCES "User"(id) ON DELETE CASCADE;

-- =====================================================
-- Create Indexes for Better Performance
-- =====================================================

CREATE INDEX idx_user_firebase_uid ON "User"("firebaseUid");
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_role ON "User"(role);
CREATE INDEX idx_user_department ON "User"("departmentId");
CREATE INDEX idx_user_student_id ON "User"("studentId");

CREATE INDEX idx_department_code ON "Department"(code);
CREATE INDEX idx_department_hod ON "Department"("hodId");

CREATE INDEX idx_batch_department ON "Batch"("departmentId");

CREATE INDEX idx_subject_department ON "Subject"("departmentId");
CREATE INDEX idx_subject_batch ON "Subject"("batchId");
CREATE INDEX idx_subject_faculty ON "Subject"("facultyId");

CREATE INDEX idx_enrollment_student ON "Enrollment"("studentId");
CREATE INDEX idx_enrollment_batch ON "Enrollment"("batchId");

CREATE INDEX idx_assignment_subject ON "Assignment"("subjectId");
CREATE INDEX idx_assignment_creator ON "Assignment"("createdById");

CREATE INDEX idx_submission_assignment ON "Submission"("assignmentId");
CREATE INDEX idx_submission_student ON "Submission"("studentId");

CREATE INDEX idx_attendance_student ON "Attendance"("studentId");
CREATE INDEX idx_attendance_subject ON "Attendance"("subjectId");
CREATE INDEX idx_attendance_date ON "Attendance"(date);

CREATE INDEX idx_grade_student ON "Grade"("studentId");
CREATE INDEX idx_grade_subject ON "Grade"("subjectId");

CREATE INDEX idx_notice_poster ON "Notice"("postedById");
CREATE INDEX idx_notice_department ON "Notice"("departmentId");

CREATE INDEX idx_complaint_student ON "Complaint"("studentId");
CREATE INDEX idx_complaint_status ON "Complaint"(status);

CREATE INDEX idx_fee_student ON "Fee"("studentId");
CREATE INDEX idx_fee_status ON "Fee"(status);

-- =====================================================
-- Insert Default College Settings
-- =====================================================

INSERT INTO "CollegeSettings" (id, "collegeName", "collegeCode")
VALUES ('default', 'University College', 'UNI');

-- =====================================================
-- ✅ DATABASE SETUP COMPLETE!
-- =====================================================
-- 
-- Next Steps:
-- 1. Create your first admin user through Prisma Studio
--    Run: npx prisma studio
-- 
-- 2. Or manually insert a Principal user:
--    INSERT INTO "User" (id, "firebaseUid", email, "fullName", role)
--    VALUES ('admin-id', 'firebase-uid-from-auth', 'admin@college.edu', 'Admin User', 'PRINCIPAL');
--
-- 3. Your app is ready to use!
-- =====================================================
