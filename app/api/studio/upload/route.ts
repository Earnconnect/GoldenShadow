import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  extractText,
  extOf,
  ALLOWED_EXTENSIONS,
  MAX_UPLOAD_BYTES,
} from "@/lib/anthropic/parsing";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  // Auth: the dashboard is behind middleware, but this is an /api route, so
  // check explicitly. Allow through in preview mode (no Supabase) so the UI is
  // demoable, but a configured app requires a signed-in user.
  if (isSupabaseConfigured) {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  const ext = extOf(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}.` },
      { status: 400 }
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "File is too large (max 10 MB)." },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = (await extractText(buffer, file.name)).trim();
    const chars = text.length;

    if (chars < 20) {
      return NextResponse.json(
        {
          error:
            "We couldn't read meaningful text from that file (it may be scanned or image-based). Try pasting the text instead.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ text, filename: file.name, chars });
  } catch {
    return NextResponse.json(
      { error: "We couldn't parse that file. Try a different format or paste the text." },
      { status: 422 }
    );
  }
}
