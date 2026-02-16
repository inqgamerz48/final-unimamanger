-- Add PARTIALLY_PAID to FeeStatus if missing
DO $$
BEGIN
    ALTER TYPE "FeeStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_PAID';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
