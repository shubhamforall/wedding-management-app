import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env and fill in VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.'
  );
}

// Not parameterized with the hand-written Database type: postgrest-js's
// generated-type parser expects the exact shape `supabase gen types` emits
// (Relationships arrays, etc.) and silently collapses mismatches to `never`.
// Once a real Supabase project exists, run `supabase gen types typescript`
// and swap this back to `createClient<Database>(...)`. Until then, query
// shapes are pinned explicitly via `.returns<T>()` per call.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
