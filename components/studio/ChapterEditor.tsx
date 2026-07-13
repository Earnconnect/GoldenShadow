"use client";

import { useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { saveChapterEdit } from "@/app/dashboard/studio/actions";

export default function ChapterEditor({
  chapterNumber,
  title,
  initialHtml,
  userId,
}: {
  chapterNumber: number;
  title: string;
  initialHtml: string;
  userId: string;
}) {
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false }),
    ],
    content: initialHtml || "<p></p>",
    immediatelyRender: false,
    editorProps: { attributes: { class: "tiptap" } },
  });

  if (!editor) return null;

  async function insertImage(file: File) {
    if (!file.type.startsWith("image/"))
      return setMsg("Please choose an image file.");
    if (file.size > 5 * 1024 * 1024) return setMsg("Image must be under 5MB.");
    if (!isSupabaseConfigured) return setMsg("Not connected.");
    setUploading(true);
    setMsg("");
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${userId}/${Date.now()}.${ext}`;
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
      editor!.chain().focus().setImage({ src: publicUrl }).run();
    } catch {
      setMsg("Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setBusy(true);
    setMsg("");
    const res = await saveChapterEdit(chapterNumber, editor!.getHTML());
    setMsg(res.ok ? "Saved." : res.message);
    setBusy(false);
  }

  const btn = (
    active: boolean,
    onClick: () => void,
    label: string,
    key?: string
  ) => (
    <button
      key={key}
      type="button"
      className={`ed-btn${active ? " active" : ""}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {label}
    </button>
  );

  return (
    <div className="chapter-editor">
      <div className="ed-toolbar">
        {btn(editor.isActive("heading", { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), "H1")}
        {btn(editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), "H2")}
        {btn(editor.isActive("heading", { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), "H3")}
        {btn(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), "B")}
        {btn(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), "I")}
        {btn(editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), "• List")}
        {btn(editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), "1. List")}
        {btn(editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), "❝ Quote")}
        {btn(
          editor.isActive("link"),
          () => {
            const prev = editor.getAttributes("link").href as string | undefined;
            const url = window.prompt("Link URL", prev ?? "https://");
            if (url === null) return;
            if (url === "") editor.chain().focus().unsetLink().run();
            else editor.chain().focus().setLink({ href: url }).run();
          },
          "Link"
        )}
        {btn(false, () => fileRef.current?.click(), uploading ? "Uploading…" : "Image")}
      </div>

      <EditorContent editor={editor} />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) insertImage(f);
          e.target.value = "";
        }}
      />

      <div className="ed-actions">
        <button type="button" className="btn-dark" onClick={save} disabled={busy}>
          {busy ? "Saving…" : `Save Chapter ${chapterNumber}`}
        </button>
        {msg && <span className="ed-msg">{msg}</span>}
      </div>
    </div>
  );
}
