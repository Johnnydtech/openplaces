/**
 * Supabase client initialization for frontend.
 *
 * Provides connection to Supabase PostgreSQL with anon key.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Verify Supabase connection from frontend.
 */
export async function verifyConnection(): Promise<{ status: string; error?: string }> {
  try {
    const { data, error } = await supabase.from('zones').select('count', { count: 'exact', head: true });

    if (error) throw error;

    return { status: 'connected' };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
