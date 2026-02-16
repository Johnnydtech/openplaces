-- Migration 007: Fix RLS policies with explicit type casts
-- Issue: Policies were missing ::text cast on user_id column
-- Date: 2026-02-15

-- ============================================================================
-- flyer_uploads RLS Policies
-- ============================================================================

-- Drop and recreate with proper type casts
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

-- ============================================================================
-- recommendations_cache RLS Policies
-- ============================================================================

-- Drop and recreate with proper type casts
DROP POLICY IF EXISTS "Users can view their own cached recommendations" ON public.recommendations_cache;
CREATE POLICY "Users can view their own cached recommendations"
  ON public.recommendations_cache
  FOR SELECT
  USING ((auth.jwt() ->> 'sub')::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert their own cached recommendations" ON public.recommendations_cache;
CREATE POLICY "Users can insert their own cached recommendations"
  ON public.recommendations_cache
  FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text);

DROP POLICY IF EXISTS "Users can update their own cached recommendations" ON public.recommendations_cache;
CREATE POLICY "Users can update their own cached recommendations"
  ON public.recommendations_cache
  FOR UPDATE
  USING ((auth.jwt() ->> 'sub')::text = user_id::text)
  WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete their own cached recommendations" ON public.recommendations_cache;
CREATE POLICY "Users can delete their own cached recommendations"
  ON public.recommendations_cache
  FOR DELETE
  USING ((auth.jwt() ->> 'sub')::text = user_id::text);

-- ============================================================================
-- Migration Notes
-- ============================================================================

COMMENT ON TABLE public.flyer_uploads IS 'Story 2.10: Stores metadata for uploaded event flyers with 7-day TTL. RLS policies enforce user isolation via Clerk JWT.';
COMMENT ON TABLE public.recommendations_cache IS 'Story 2.11: Cache recommendations per user for 30 days to avoid redundant API calls. RLS policies enforce user isolation via Clerk JWT.';
