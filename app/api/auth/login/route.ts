import {
  createSession, findUserByEmail, isValidEmail, normalizeEmail,
  sessionCookie, verifyPassword,
} from "../../../lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string };
    const email = normalizeEmail(body.email ?? "");
    const password = body.password ?? "";

    if (!isValidEmail(email) || !password) {
      return Response.json({ error: "Invalid email or password." }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    const ok = user ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || !ok) {
      // Generic message to avoid leaking which emails exist.
      return Response.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const session = await createSession(user.id);
    const secure = new URL(request.url).protocol === "https:";
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Set-Cookie": sessionCookie(session.id, session.maxAgeMs, secure) },
    });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Something went wrong." }, { status: 500 });
  }
}
