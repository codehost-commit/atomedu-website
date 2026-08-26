import {
  createSession, createUser, findUserByEmail, hashPassword,
  isValidEmail, normalizeEmail, sessionCookie,
} from "../../../lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string; name?: string };
    const email = normalizeEmail(body.email ?? "");
    const password = body.password ?? "";
    const name = (body.name ?? "").trim() || null;

    if (!isValidEmail(email)) return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    if (password.length < 8) return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });

    if (await findUserByEmail(email)) {
      return Response.json({ error: "An account with this email already exists. Try signing in." }, { status: 409 });
    }

    const user = await createUser(email, await hashPassword(password), name);
    const session = await createSession(user.id);
    const secure = new URL(request.url).protocol === "https:";
    return new Response(JSON.stringify({ ok: true }), {
      status: 201,
      headers: { "Content-Type": "application/json", "Set-Cookie": sessionCookie(session.id, session.maxAgeMs, secure) },
    });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Something went wrong." }, { status: 500 });
  }
}
