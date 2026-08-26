import { consumeMagicToken, createSession, createUser, findUserByEmail, sessionCookie } from "../../../../lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const email = token ? await consumeMagicToken(token) : null;

  if (!email) {
    return new Response(null, { status: 302, headers: { Location: "/login?error=link" } });
  }

  const user = (await findUserByEmail(email)) ?? (await createUser(email, null, null));
  const session = await createSession(user.id);
  const secure = url.protocol === "https:";
  return new Response(null, {
    status: 302,
    headers: { Location: "/", "Set-Cookie": sessionCookie(session.id, session.maxAgeMs, secure) },
  });
}
