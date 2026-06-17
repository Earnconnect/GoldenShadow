import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type Profile = {
  id: string;
  full_name: string | null;
  role: "admin" | "creator" | string;
  creator_slug: string | null;
};

export type SessionInfo = {
  userId: string;
  email: string | null;
  profile: Profile | null;
};

// Returns the signed-in user + their profile, or null if not signed in
// (or Supabase isn't configured yet).
export async function getSession(): Promise<SessionInfo | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, creator_slug")
    .eq("id", user.id)
    .single();

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: (profile as Profile) ?? null,
  };
}

export function isAdmin(session: SessionInfo | null): boolean {
  return session?.profile?.role === "admin";
}
