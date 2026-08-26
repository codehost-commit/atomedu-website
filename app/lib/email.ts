import { env } from "cloudflare:workers";

type EnvBag = Record<string, string | undefined>;

export type SendResult = { sent: boolean; devLink?: string; error?: string };

export async function sendMagicLink(to: string, link: string): Promise<SendResult> {
  const bag = env as unknown as EnvBag;
  const apiKey = bag.RESEND_API_KEY;
  const from = bag.EMAIL_FROM ?? "Atom Edu <onboarding@resend.dev>";

  // No email provider configured yet → dev mode: return the link so the UI can
  // show it, and log it to the server console.
  if (!apiKey) {
    console.log(`[atom-edu] Magic sign-in link for ${to}: ${link}`);
    return { sent: false, devLink: link };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        subject: "Your Atom Edu sign-in link",
        html: emailHtml(link),
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      return { sent: false, error: `Email provider returned ${res.status}: ${detail.slice(0, 300)}` };
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : "Failed to send email." };
  }
}

function emailHtml(link: string): string {
  return `<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:480px;margin:0 auto;color:#14231e">
  <h2 style="font-size:20px;letter-spacing:0">Sign in to Atom Edu</h2>
  <p style="font-size:14px;line-height:1.6;color:#41493f">Click the button below to sign in. This link expires in 15 minutes and can only be used once.</p>
  <p style="margin:26px 0"><a href="${link}" style="background:#14231e;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;display:inline-block">Sign in to Atom Edu</a></p>
  <p style="font-size:12px;color:#6d746e">If you didn't request this, you can safely ignore this email.</p>
</div>`;
}
