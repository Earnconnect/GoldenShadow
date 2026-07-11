import { createAdminClient } from "@/lib/supabase/admin";

// Best-effort audit logging. Writes through the service-role client (bypasses
// RLS) and never throws — a logging failure must not affect the user action.
export async function logActivity(entry: {
  action: string;
  detail?: string | null;
  userId?: string | null;
  actor?: string | null;
  entity?: string | null;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    if (!admin) return;
    await admin.from("activity_log").insert({
      action: entry.action,
      detail: entry.detail ?? null,
      user_id: entry.userId ?? null,
      actor: entry.actor ?? null,
      entity: entry.entity ?? null,
    });
  } catch {
    // swallow — best-effort
  }
}
