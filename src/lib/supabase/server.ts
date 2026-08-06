import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

export function getSupabaseServerClient(): SupabaseClient<Database> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error('Supabase server environment variables are not configured');
  }

  return createClient<Database>(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
