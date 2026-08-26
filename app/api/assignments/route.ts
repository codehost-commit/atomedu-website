import { getSessionUser } from "../../lib/auth";
import { saveAssignment } from "../../lib/assignments";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  try {
    const body = (await request.json().catch(() => ({}))) as { title?: string; kind?: string; prompt?: string; content?: string };
    if (!body.content?.trim()) return Response.json({ error: "Nothing to save." }, { status: 400 });
    const id = await saveAssignment(user.id, {
      title: body.title ?? "Untitled",
      kind: body.kind ?? "assignment",
      prompt: body.prompt ?? "",
      content: body.content,
    });
    return Response.json({ ok: true, id });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed to save." }, { status: 500 });
  }
}
