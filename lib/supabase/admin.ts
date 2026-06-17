import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isAdminClientConfigured =
  SUPABASE_URL.length > 0 && SERVICE_ROLE_KEY.length > 0;

// Service-role Supabase client — SERVER ONLY. Bypasses Row Level Security.
// Used exclusively by trusted server code (the Stripe webhook) to record
// orders. Never import this into a client component.
export function createAdminClient() {
  if (!isAdminClientConfigured) return null;
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
