-- Migration: Create flyer_uploads table for Story 2.10
-- Description: Store uploaded flyer metadata with 7-day expiration
-- Author: Claude Code
-- Date: 2026-02-15

-- Create flyer_uploads table
CREATE TABLE IF NOT EXISTS public.flyer_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Clerk user ID
  storage_path TEXT NOT NULL, -- Path in Supabase Storage (e.g., 'flyers/user123/abc-def.jpg')
  file_name TEXT NOT NULL, -- Original filename
  file_size INTEGER NOT NULL, -- File size in bytes
  mime_type TEXT NOT NULL, -- e.g., 'image/jpeg', 'image/png', 'application/pdf'
  event_data JSONB, -- Extracted event details from AI analysis
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  CONSTRAINT flyer_uploads_user_id_check CHECK (char_length(user_id) > 0),
  CONSTRAINT flyer_uploads_storage_path_check CHECK (char_length(storage_path) > 0),
  CONSTRAINT flyer_uploads_file_size_check CHECK (file_size > 0 AND file_size <= 10485760) -- Max 10MB
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_flyer_uploads_user_id ON public.flyer_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_flyer_uploads_created_at ON public.flyer_uploads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flyer_uploads_expires_at ON public.flyer_uploads(expires_at);

-- Enable Row Level Security
ALTER TABLE public.flyer_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own uploads
DROP POLICY IF EXISTS "Users can view their own flyer uploads" ON public.flyer_uploads;
CREATE POLICY "Users can view their own flyer uploads"
  ON public.flyer_uploads
  FOR SELECT
  USING ((auth.jwt() ->> 'sub')::text = user_id::text);

-- RLS Policy: Users can only insert their own uploads
DROP POLICY IF EXISTS "Users can insert their own flyer uploads" ON public.flyer_uploads;
CREATE POLICY "Users can insert their own flyer uploads"
  ON public.flyer_uploads
  FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text);

-- RLS Policy: Users can only delete their own uploads
DROP POLICY IF EXISTS "Users can delete their own flyer uploads" ON public.flyer_uploads;
CREATE POLICY "Users can delete their own flyer uploads"
  ON public.flyer_uploads
  FOR DELETE
  USING ((auth.jwt() ->> 'sub')::text = user_id::text);

-- Function to automatically delete expired flyers (run daily)
CREATE OR REPLACE FUNCTION delete_expired_flyers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete expired flyer records
  DELETE FROM public.flyer_uploads
  WHERE expires_at < NOW();

  -- Note: Actual file deletion from Storage bucket should be handled by a separate process
  -- This can be done via Supabase Edge Functions or a scheduled job
END;
$$;

-- Create a scheduled job to run cleanup (requires pg_cron extension)
-- Note: Uncomment if pg_cron is available on your Supabase instance
-- SELECT cron.schedule(
--   'delete-expired-flyers',
--   '0 2 * * *', -- Run at 2 AM daily
--   'SELECT delete_expired_flyers();'
-- );

-- Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON public.flyer_uploads TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Add comment
COMMENT ON TABLE public.flyer_uploads IS 'Story 2.10: Stores metadata for uploaded event flyers with 7-day TTL';
