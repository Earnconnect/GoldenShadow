import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from "./config";

// Cookieless anon client for reading public data (e.g. creator profiles) in
// Server Components without pulling in request cookies — keeps those routes
// cacheable. Returns null when Supabase isn't configured.
export function createPublicClient() {
  if (!isSupabaseConfigured) return null;
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
