-- Supabase Migration: Usage Tracking for Abuse Prevention
-- Creates usage_logs table to track API usage per user

-- Create usage_logs table
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,  -- Clerk user ID
    operation_type TEXT NOT NULL,  -- analyze, recommend, save, geocode
    cost_estimate DECIMAL(10, 6) DEFAULT 0.0,  -- Estimated API cost in USD
    metadata JSONB DEFAULT '{}',  -- Additional data (file_size, confidence, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX idx_usage_logs_operation_type ON public.usage_logs(operation_type);
CREATE INDEX idx_usage_logs_created_at ON public.usage_logs(created_at DESC);
CREATE INDEX idx_usage_logs_user_operation ON public.usage_logs(user_id, operation_type, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own usage logs
CREATE POLICY "Users can view own usage logs"
    ON public.usage_logs
    FOR SELECT
    USING (auth.uid()::text = user_id);

-- RLS Policy: Service role can insert usage logs (backend)
CREATE POLICY "Service role can insert usage logs"
    ON public.usage_logs
    FOR INSERT
    WITH CHECK (true);

-- RLS Policy: Service role can read all usage logs (for admin/analytics)
CREATE POLICY "Service role can read all usage logs"
    ON public.usage_logs
    FOR SELECT
    USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE public.usage_logs IS 'Tracks API usage per user for abuse prevention and cost monitoring';
COMMENT ON COLUMN public.usage_logs.user_id IS 'Clerk user ID from authentication';
COMMENT ON COLUMN public.usage_logs.operation_type IS 'Type of operation: analyze, recommend, save, geocode';
COMMENT ON COLUMN public.usage_logs.cost_estimate IS 'Estimated API cost in USD';
COMMENT ON COLUMN public.usage_logs.metadata IS 'Additional metadata (file_size, confidence, processing_time, etc.)';

-- Create a view for daily usage summaries
CREATE OR REPLACE VIEW public.daily_usage_summary AS
SELECT
    user_id,
    operation_type,
    DATE(created_at) as usage_date,
    COUNT(*) as operation_count,
    SUM(cost_estimate) as total_cost
FROM public.usage_logs
GROUP BY user_id, operation_type, DATE(created_at)
ORDER BY usage_date DESC, user_id;

COMMENT ON VIEW public.daily_usage_summary IS 'Daily usage summary per user and operation type';

-- Grant permissions
GRANT SELECT ON public.usage_logs TO authenticated;
GRANT ALL ON public.usage_logs TO service_role;
GRANT SELECT ON public.daily_usage_summary TO authenticated, service_role;
