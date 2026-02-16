-- Create AttendanceStatus Enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Add timetableUrl column to Batch table
ALTER TABLE "Batch" ADD COLUMN IF NOT EXISTS "timetableUrl" TEXT;

-- 2. Add batchId column to Attendance if table exists but column is missing
-- We set a default of '' to satisfy NOT NULL constraint if rows exist, 
-- but ideally you should truncate or migrate existing data properly.
DO $$ BEGIN
    ALTER TABLE "Attendance" ADD COLUMN "batchId" TEXT NOT NULL DEFAULT '';
EXCEPTION
    WHEN duplicate_column THEN null;
    WHEN undefined_table THEN null; -- Table will be created next
END $$;

-- 3. Create Attendance table if it doesn't exist (or update if it does)
CREATE TABLE IF NOT EXISTS "Attendance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "markedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- 4. Create Indexes and Constraints for Attendance
CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_studentId_subjectId_date_key" ON "Attendance"("studentId", "subjectId", "date");
CREATE INDEX IF NOT EXISTS "Attendance_batchId_idx" ON "Attendance"("batchId");
CREATE INDEX IF NOT EXISTS "Attendance_date_idx" ON "Attendance"("date");

-- 5. Add Foreign Keys
DO $$ BEGIN
    ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Note: This Foreign Key might fail if existing rows have batchId = '' (invalid ID).
-- If it fails, you may need to: DELETE FROM "Attendance" WHERE "batchId" = '';
DO $$ BEGIN
    ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN foreign_key_violation THEN 
        RAISE NOTICE 'Skipping batchId foreign key constraint due to existing invalid data';
END $$;

DO $$ BEGIN
    ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
