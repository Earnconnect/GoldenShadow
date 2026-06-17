// Server-only text extraction for uploaded source material.
// Runs in the Node runtime (see app/api/studio/upload/route.ts).

export const ALLOWED_EXTENSIONS = ["txt", "md", "markdown", "docx", "pdf"];
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

export function extOf(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i >= 0 ? filename.slice(i + 1).toLowerCase() : "";
}

export async function extractText(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = extOf(filename);

  if (ext === "txt" || ext === "md" || ext === "markdown") {
    return buffer.toString("utf-8");
  }

  if (ext === "docx") {
    // mammoth pulls raw text out of a .docx
    const mammoth = (await import("mammoth")).default;
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }

  if (ext === "pdf") {
    // unpdf is serverless-safe and has no filesystem side effects
    const { extractText: pdfExtract, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await pdfExtract(pdf, { mergePages: true });
    return Array.isArray(text) ? text.join("\n") : text;
  }

  throw new Error(`Unsupported file type: .${ext}`);
}
