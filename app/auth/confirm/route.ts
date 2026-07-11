import { type NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { siteUrl } from "@/lib/email";

export const dynamic = "force-dynamic";

// Verifies an email action link (invite / recovery) and establishes the
// session cookie, then forwards the user on (default: /welcome to set a password).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/welcome";

  if (isSupabaseConfigured && token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(new URL(next, siteUrl()));
    }
  }

  return NextResponse.redirect(new URL("/login?error=link", siteUrl()));
}
