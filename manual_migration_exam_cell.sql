-- Add examCellCoordinatorId to Department table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Department' AND column_name = 'examCellCoordinatorId') THEN
        ALTER TABLE "Department" ADD COLUMN "examCellCoordinatorId" TEXT;
        ALTER TABLE "Department" ADD CONSTRAINT "Department_examCellCoordinatorId_key" UNIQUE ("examCellCoordinatorId");
        
        -- Add foreign key constraint (assuming User table is "User")
        ALTER TABLE "Department" ADD CONSTRAINT "Department_examCellCoordinatorId_fkey" FOREIGN KEY ("examCellCoordinatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
