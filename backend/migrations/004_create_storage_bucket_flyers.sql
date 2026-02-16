-- Migration: Create Storage bucket for flyer uploads (Story 2.10)
-- Description: Configure Supabase Storage bucket with security policies
-- Author: Claude Code
-- Date: 2026-02-15

-- Create storage bucket for flyers
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'flyers',
  'flyers',
  false, -- Not public (requires authentication)
  10485760, -- 10MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

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

-- Note: Cannot add comment to system table storage.buckets
-- COMMENT ON TABLE storage.buckets IS 'Storage bucket for event flyer uploads with 10MB limit';
