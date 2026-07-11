// Lightweight Resend integration (via REST, no SDK dependency).
// Every send is best-effort: a failure must never break the underlying action.

export const isResendConfigured = !!process.env.RESEND_API_KEY;

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const FROM =
  process.env.RESEND_FROM ||
  "Golden Shadow Publishing <onboarding@resend.dev>";

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://goldenshadowhouse.com").replace(
    /\/$/,
    ""
  );
}

// Escape user-supplied text before embedding it in email HTML.
export function esc(s: string): string {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c] as string
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendEmail(opts: {
  to: string | (string | null | undefined)[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<void> {
  if (!isResendConfigured) return;

  const list = (Array.isArray(opts.to) ? opts.to : [opts.to]).filter(
    (e): e is string => !!e && EMAIL_RE.test(e)
  );
  if (list.length === 0) return;

  try {
    await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: list,
        subject: opts.subject,
        html: opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
  } catch {
    // best-effort — swallow
  }
}

// Branded HTML wrapper for a notification email.
export function emailShell(
  heading: string,
  bodyHtml: string,
  cta?: { label: string; url: string }
): string {
  return `<!doctype html><html><body style="margin:0;background:#f7f3ea;font-family:Arial,Helvetica,sans-serif;color:#1a1712">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="font-family:Georgia,serif;font-size:20px;font-weight:bold;margin-bottom:20px">Golden Shadow <span style="color:#a9772f">Publishing</span></div>
    <div style="background:#fffdf8;border:1px solid #e7e0d1;border-radius:8px;padding:32px">
      <h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 16px">${esc(heading)}</h1>
      <div style="font-size:15px;line-height:1.6;color:#534b3d">${bodyHtml}</div>
      ${
        cta
          ? `<a href="${cta.url}" style="display:inline-block;margin-top:24px;background:#1a1712;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:4px;font-size:14px">${esc(
              cta.label
            )}</a>`
          : ""
      }
    </div>
    <p style="font-size:12px;color:#9b9180;margin-top:20px;text-align:center">Golden Shadow Publishing · <a href="${siteUrl()}" style="color:#a9772f;text-decoration:none">goldenshadowhouse.com</a></p>
  </div></body></html>`;
}

// The studio's notification inbox = the admin-editable contact email.
export async function studioInbox(): Promise<string | null> {
  try {
    const { getSettings } = await import("@/lib/settings");
    const s = await getSettings();
    return s.contactEmail || null;
  } catch {
    return null;
  }
}
