import { createClient } from '@supabase/supabase-js';

export const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a dummy client or handle build-time execution
    // In Next.js, this might happen during static generation if env vars are missing
    return createClient('https://placeholder.supabase.co', 'placeholder');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = getSupabase();
