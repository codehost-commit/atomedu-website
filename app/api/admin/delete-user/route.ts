import { getSessionUser } from "../../../lib/auth";
import { deleteUserById } from "../../../lib/admin";

export async function POST(request: Request) {
  const admin = await getSessionUser();
  if (!admin?.isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = (await request.json().catch(() => ({}))) as { userId?: string };
    if (!body.userId) return Response.json({ error: "userId required" }, { status: 400 });
    if (body.userId === admin.id) return Response.json({ error: "You can't delete your own admin account here." }, { status: 400 });
    await deleteUserById(body.userId);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
