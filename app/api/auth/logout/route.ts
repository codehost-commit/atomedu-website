import { clearSessionCookie, deleteSession, readSessionId } from "../../../lib/auth";

async function handle(request: Request): Promise<Response> {
  const sid = readSessionId(request);
  if (sid) await deleteSession(sid);
  const secure = new URL(request.url).protocol === "https:";
  return new Response(null, { status: 302, headers: { Location: "/", "Set-Cookie": clearSessionCookie(secure) } });
}

export async function POST(request: Request): Promise<Response> {
  return handle(request);
}
export async function GET(request: Request): Promise<Response> {
  return handle(request);
}
