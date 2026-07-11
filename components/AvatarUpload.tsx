"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { saveAvatar } from "@/app/dashboard/actions";

export default function AvatarUpload({
  userId,
  initial,
  name,
  currentUrl,
}: {
  userId: string;
  initial: string;
  name: string;
  currentUrl?: string;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(currentUrl);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null
  );

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg(null);
    if (!file.type.startsWith("image/"))
      return setMsg({ kind: "err", text: "Please choose an image file." });
    if (file.size > 5 * 1024 * 1024)
      return setMsg({ kind: "err", text: "Image must be under 5MB." });
    if (!isSupabaseConfigured)
      return setMsg({ kind: "err", text: "Not connected to the database." });

    setBusy(true);
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (upErr) {
        setMsg({ kind: "err", text: upErr.message });
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      const res = await saveAvatar(publicUrl);
      if (!res.ok) {
        setMsg({ kind: "err", text: res.message });
        return;
      }
      setUrl(publicUrl);
      setMsg({ kind: "ok", text: "Photo updated." });
      router.refresh();
    } catch {
      setMsg({ kind: "err", text: "Upload failed. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="avatar-upload">
      <div className="avatar-preview">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={name} />
        ) : (
          <span>{initial}</span>
        )}
      </div>
      <div className="avatar-upload-body">
        <label className="btn-dark avatar-btn">
          {busy ? "Uploading…" : url ? "Change photo" : "Upload photo"}
          <input
            type="file"
            accept="image/*"
            onChange={onFile}
            disabled={busy}
            hidden
          />
        </label>
        <p className="form-fineprint" style={{ marginTop: "8px" }}>
          Square images look best. JPG or PNG, up to 5MB.
        </p>
        {msg && (
          <p
            className={msg.kind === "err" ? "form-error" : "form-success"}
            style={{ marginTop: "6px" }}
          >
            {msg.text}
          </p>
        )}
      </div>
    </div>
  );
}
