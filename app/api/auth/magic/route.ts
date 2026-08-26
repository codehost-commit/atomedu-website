import { createMagicToken, isValidEmail, normalizeEmail } from "../../../lib/auth";
import { sendMagicLink } from "../../../lib/email";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { email?: string };
    const email = normalizeEmail(body.email ?? "");
    if (!isValidEmail(email)) return Response.json({ error: "Enter a valid email address." }, { status: 400 });

    const token = await createMagicToken(email);
    const origin = new URL(request.url).origin;
    const link = `${origin}/api/auth/magic/verify?token=${encodeURIComponent(token)}`;
    const result = await sendMagicLink(email, link);

    if (result.error) return Response.json({ error: result.error }, { status: 502 });
    // devLink is only present when no email provider is configured.
    return Response.json({ ok: true, devLink: result.devLink });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Something went wrong." }, { status: 500 });
  }
}
