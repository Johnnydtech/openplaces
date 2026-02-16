-- Migration: Create recommendations_cache table for Story 2.11
-- Description: Cache recommendations per user to avoid redundant API calls
-- Author: Claude Code
-- Date: 2026-02-15

-- Create recommendations_cache table
CREATE TABLE IF NOT EXISTS public.recommendations_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Clerk user ID
  event_hash TEXT NOT NULL, -- MD5/SHA256 hash of event details for cache key
  event_data JSONB NOT NULL, -- Original event data (name, date, venue, etc.)
  zones JSONB NOT NULL, -- Array of zone recommendations with scores
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT recommendations_cache_user_id_check CHECK (char_length(user_id) > 0),
  CONSTRAINT recommendations_cache_event_hash_check CHECK (char_length(event_hash) > 0),
  CONSTRAINT recommendations_cache_unique_user_event UNIQUE (user_id, event_hash)
);

-- Create indexes for cache lookups
CREATE INDEX IF NOT EXISTS idx_recommendations_cache_user_id ON public.recommendations_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_cache_event_hash ON public.recommendations_cache(event_hash);
CREATE INDEX IF NOT EXISTS idx_recommendations_cache_user_event ON public.recommendations_cache(user_id, event_hash);
CREATE INDEX IF NOT EXISTS idx_recommendations_cache_expires_at ON public.recommendations_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_recommendations_cache_last_accessed ON public.recommendations_cache(last_accessed_at DESC);

-- Enable Row Level Security
ALTER TABLE public.recommendations_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own cached recommendations
DROP POLICY IF EXISTS "Users can view their own cached recommendations" ON public.recommendations_cache;
CREATE POLICY "Users can view their own cached recommendations"
  ON public.recommendations_cache
  FOR SELECT
  USING ((auth.jwt() ->> 'sub')::text = user_id::text);

-- RLS Policy: Users can only insert their own cached recommendations
DROP POLICY IF EXISTS "Users can insert their own cached recommendations" ON public.recommendations_cache;
CREATE POLICY "Users can insert their own cached recommendations"
  ON public.recommendations_cache
  FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text);

-- RLS Policy: Users can update their own cached recommendations (for last_accessed_at)
DROP POLICY IF EXISTS "Users can update their own cached recommendations" ON public.recommendations_cache;
CREATE POLICY "Users can update their own cached recommendations"
  ON public.recommendations_cache
  FOR UPDATE
  USING ((auth.jwt() ->> 'sub')::text = user_id::text)
  WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text);

-- RLS Policy: Users can delete their own cached recommendations
DROP POLICY IF EXISTS "Users can delete their own cached recommendations" ON public.recommendations_cache;
CREATE POLICY "Users can delete their own cached recommendations"
  ON public.recommendations_cache
  FOR DELETE
  USING ((auth.jwt() ->> 'sub')::text = user_id::text);

-- Function to update last_accessed_at timestamp
CREATE OR REPLACE FUNCTION update_cache_last_accessed()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.last_accessed_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger to auto-update last_accessed_at on SELECT (via manual UPDATE)
-- Note: This would be called from application code when cache hit occurs
DROP TRIGGER IF EXISTS trigger_update_cache_last_accessed ON public.recommendations_cache;
CREATE TRIGGER trigger_update_cache_last_accessed
  BEFORE UPDATE ON public.recommendations_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_cache_last_accessed();

-- Function to automatically delete expired cache entries (run daily)
CREATE OR REPLACE FUNCTION delete_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete expired cache records
  DELETE FROM public.recommendations_cache
  WHERE expires_at < NOW();

  -- Optional: Delete least recently used entries if cache grows too large
  -- DELETE FROM public.recommendations_cache
  -- WHERE id IN (
  --   SELECT id FROM public.recommendations_cache
  --   ORDER BY last_accessed_at ASC
  --   LIMIT 1000
  -- );
END;
$$;

-- Create a scheduled job to run cache cleanup (requires pg_cron extension)
-- Note: Uncomment if pg_cron is available on your Supabase instance
-- SELECT cron.schedule(
--   'delete-expired-cache',
--   '0 3 * * *', -- Run at 3 AM daily
--   'SELECT delete_expired_cache();'
-- );

-- Function to generate event hash (for use in application)
CREATE OR REPLACE FUNCTION generate_event_hash(
  p_event_name TEXT,
  p_event_date TEXT,
  p_event_time TEXT,
  p_venue_lat NUMERIC,
  p_venue_lon NUMERIC,
  p_target_audience TEXT[],
  p_event_type TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_hash_input TEXT;
BEGIN
  -- Create deterministic string from event details
  v_hash_input :=
    p_event_name || '|' ||
    p_event_date || '|' ||
    p_event_time || '|' ||
    p_venue_lat::TEXT || '|' ||
    p_venue_lon::TEXT || '|' ||
    array_to_string(p_target_audience, ',') || '|' ||
    p_event_type;

  -- Return MD5 hash
  RETURN md5(v_hash_input);
END;
$$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recommendations_cache TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Add comment
COMMENT ON TABLE public.recommendations_cache IS 'Story 2.11: Cache recommendations per user for 30 days to avoid redundant API calls';
COMMENT ON FUNCTION generate_event_hash IS 'Generate deterministic hash from event details for cache key';
