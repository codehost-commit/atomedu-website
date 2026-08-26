import { getSessionUser } from "../../lib/auth";
import { DEFAULT_PROVIDER, clearKey, saveSettings } from "../../lib/settings";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: string; provider?: string; baseUrl?: string; model?: string; apiKey?: string;
    };
    if (body.action === "clear") {
      await clearKey(user.id);
      return Response.json({ ok: true });
    }
    await saveSettings(user.id, {
      provider: body.provider ?? DEFAULT_PROVIDER,
      baseUrl: body.baseUrl ?? "",
      model: body.model ?? "",
      apiKey: body.apiKey,
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed to save." }, { status: 500 });
  }
}
