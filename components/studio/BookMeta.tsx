"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { saveBookMeta } from "@/app/dashboard/studio/actions";

export default function BookMeta({
  userId,
  initial,
}: {
  userId: string;
  initial: {
    bookTitle?: string;
    subtitle?: string;
    author?: string;
    coverUrl?: string;
  };
}) {
  const [bookTitle, setBookTitle] = useState(initial.bookTitle ?? "");
  const [subtitle, setSubtitle] = useState(initial.subtitle ?? "");
  const [author, setAuthor] = useState(initial.author ?? "");
  const [coverUrl, setCoverUrl] = useState(initial.coverUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadCover(file: File) {
    if (!file.type.startsWith("image/")) return setMsg("Please choose an image.");
    if (file.size > 5 * 1024 * 1024) return setMsg("Image must be under 5MB.");
    if (!isSupabaseConfigured) return setMsg("Not connected.");
    setUploading(true);
    setMsg("");
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${userId}/cover-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("book-images")
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (error) {
        setMsg(error.message);
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("book-images").getPublicUrl(path);
      setCoverUrl(publicUrl);
    } catch {
      setMsg("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setBusy(true);
    setMsg("");
    const res = await saveBookMeta({ bookTitle, subtitle, author, coverUrl });
    setMsg(res.ok ? "Saved." : res.message);
    setBusy(false);
  }

  return (
    <div className="book-meta">
      <div className="book-meta-cover">
        <div className="book-cover-preview">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="Cover" />
          ) : (
            <span>No cover</span>
          )}
        </div>
        <button
          type="button"
          className="filter-chip"
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? "Uploading…" : coverUrl ? "Change cover" : "Upload cover"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadCover(f);
            e.target.value = "";
          }}
        />
      </div>

      <div className="book-meta-fields">
        <div className="form-field">
          <label className="form-label">Book title</label>
          <input
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            maxLength={200}
            placeholder="Untitled book"
          />
        </div>
        <div className="form-field">
          <label className="form-label">Subtitle</label>
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            maxLength={300}
          />
        </div>
        <div className="form-field">
          <label className="form-label">Author</label>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            maxLength={200}
          />
        </div>
        <div>
          <button
            type="button"
            className="btn-dark"
            onClick={save}
            disabled={busy}
          >
            {busy ? "Saving…" : "Save cover & title"}
          </button>
          {msg && (
            <span className="ed-msg" style={{ marginLeft: "12px" }}>
              {msg}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
