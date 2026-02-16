-- Migration 006: Fix flyer_uploads.user_id type from UUID to TEXT
-- Story 2.10: user_id should be TEXT to store Clerk user IDs (e.g., "user_2abc...")
-- Date: 2026-02-15

-- Step 1: Drop all RLS policies (they depend on user_id column)
DROP POLICY IF EXISTS "Users can view their own flyer uploads" ON public.flyer_uploads;
DROP POLICY IF EXISTS "Users can insert their own flyer uploads" ON public.flyer_uploads;
DROP POLICY IF EXISTS "Users can delete their own flyer uploads" ON public.flyer_uploads;

-- Step 2: Drop foreign key constraint
ALTER TABLE public.flyer_uploads
DROP CONSTRAINT IF EXISTS flyer_uploads_user_id_fkey;

-- Step 3: Drop existing check constraint
ALTER TABLE public.flyer_uploads
DROP CONSTRAINT IF EXISTS flyer_uploads_user_id_check;

-- Step 4: Change user_id column from UUID to TEXT
ALTER TABLE public.flyer_uploads
ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- Step 5: Add NOT NULL constraint
ALTER TABLE public.flyer_uploads
ALTER COLUMN user_id SET NOT NULL;

-- Step 6: Add check constraint
ALTER TABLE public.flyer_uploads
ADD CONSTRAINT flyer_uploads_user_id_check CHECK (char_length(user_id) > 0);

-- Step 7: Add missing columns if not exists
ALTER TABLE public.flyer_uploads
ADD COLUMN IF NOT EXISTS file_name TEXT NOT NULL DEFAULT 'unknown.jpg';

ALTER TABLE public.flyer_uploads
ADD COLUMN IF NOT EXISTS file_size INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.flyer_uploads
ADD COLUMN IF NOT EXISTS mime_type TEXT NOT NULL DEFAULT 'image/jpeg';

-- Step 8: Add check constraint for file size
ALTER TABLE public.flyer_uploads
DROP CONSTRAINT IF EXISTS flyer_uploads_file_size_check;

ALTER TABLE public.flyer_uploads
ADD CONSTRAINT flyer_uploads_file_size_check CHECK (file_size > 0 AND file_size <= 10485760);

-- Step 9: Add check constraint for storage_path
ALTER TABLE public.flyer_uploads
DROP CONSTRAINT IF EXISTS flyer_uploads_storage_path_check;

ALTER TABLE public.flyer_uploads
ADD CONSTRAINT flyer_uploads_storage_path_check CHECK (char_length(storage_path) > 0);

-- Step 10: Recreate RLS policies with TEXT comparison
DROP POLICY IF EXISTS "Users can view their own flyer uploads" ON public.flyer_uploads;
CREATE POLICY "Users can view their own flyer uploads"
  ON public.flyer_uploads
  FOR SELECT
  USING ((auth.jwt() ->> 'sub')::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert their own flyer uploads" ON public.flyer_uploads;
CREATE POLICY "Users can insert their own flyer uploads"
  ON public.flyer_uploads
  FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete their own flyer uploads" ON public.flyer_uploads;
CREATE POLICY "Users can delete their own flyer uploads"
  ON public.flyer_uploads
  FOR DELETE
  USING ((auth.jwt() ->> 'sub')::text = user_id::text);

-- Step 11: Add comment
COMMENT ON COLUMN public.flyer_uploads.user_id IS 'Clerk user ID (text format, e.g., user_2abc...)';
