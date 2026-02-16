-- Create CollegeSettings table
CREATE TABLE IF NOT EXISTS "CollegeSettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "collegeName" TEXT NOT NULL DEFAULT 'My College',
  "collegeCode" TEXT NOT NULL DEFAULT 'UNI',
  "logoUrl" TEXT,
  "address" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "academicYear" TEXT NOT NULL DEFAULT '2024-2025',
  "isSetupComplete" BOOLEAN NOT NULL DEFAULT false,
  "setupCompletedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CollegeSettings_pkey" PRIMARY KEY ("id")
);

-- Safely create enums
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FeeStatus') THEN
        CREATE TYPE "FeeStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'WAIVED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FeeType') THEN
        CREATE TYPE "FeeType" AS ENUM ('TUITION', 'EXAM', 'LIBRARY', 'HOSTEL', 'TRANSPORT', 'LAB', 'MISCELLANEOUS');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentMode') THEN
        CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'BANK_TRANSFER', 'ONLINE', 'CHEQUE', 'UPI');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Fee" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "status" "FeeStatus" NOT NULL DEFAULT 'PENDING',
  "feeType" "FeeType" NOT NULL DEFAULT 'TUITION',
  "paidAt" TIMESTAMP(3),
  "paymentMode" "PaymentMode",
  "description" TEXT,
  "academicYear" TEXT NOT NULL,
  "remarks" TEXT,
  "markedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Fee_pkey" PRIMARY KEY ("id")
);

-- Add missing columns to Fee if they don't exist (for existing tables)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Fee' AND column_name = 'markedById') THEN
        ALTER TABLE "Fee" ADD COLUMN "markedById" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Fee' AND column_name = 'studentId') THEN
        ALTER TABLE "Fee" ADD COLUMN "studentId" TEXT;
    END IF;
END $$;

-- Add relations for Fee if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Fee_studentId_fkey') THEN
        ALTER TABLE "Fee" ADD CONSTRAINT "Fee_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Fee_markedById_fkey') THEN
        ALTER TABLE "Fee" ADD CONSTRAINT "Fee_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
