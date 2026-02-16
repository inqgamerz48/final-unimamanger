-- Add new columns to Subject table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Subject' AND column_name = 'credits') THEN
        ALTER TABLE "Subject" ADD COLUMN "credits" INTEGER NOT NULL DEFAULT 3;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Subject' AND column_name = 'type') THEN
        ALTER TABLE "Subject" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'CORE';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Subject' AND column_name = 'electiveGroupId') THEN
        ALTER TABLE "Subject" ADD COLUMN "electiveGroupId" TEXT;
    END IF;
END $$;
