-- Migration: Create storage policies for flyers bucket (Story 2.10)
-- Description: RLS policies for user-specific flyer access
-- Author: Claude Code
-- Date: 2026-02-15
--
-- NOTE: Create the 'flyers' bucket manually via Supabase Dashboard first!
-- Dashboard → Storage → New bucket → Name: 'flyers', Public: false

-- Storage Policy: Users can upload to their own folder
DROP POLICY IF EXISTS "Users can upload flyers to their folder" ON storage.objects;
CREATE POLICY "Users can upload flyers to their folder"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'flyers'
    AND (storage.foldername(name))[1]::text = (auth.jwt() ->> 'sub')::text
  );

-- Storage Policy: Users can view their own uploaded flyers
DROP POLICY IF EXISTS "Users can view their own flyers" ON storage.objects;
CREATE POLICY "Users can view their own flyers"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'flyers'
    AND (storage.foldername(name))[1]::text = (auth.jwt() ->> 'sub')::text
  );

-- Storage Policy: Users can delete their own flyers
DROP POLICY IF EXISTS "Users can delete their own flyers" ON storage.objects;
CREATE POLICY "Users can delete their own flyers"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'flyers'
    AND (storage.foldername(name))[1]::text = (auth.jwt() ->> 'sub')::text
  );
