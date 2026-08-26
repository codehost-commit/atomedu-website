import { getSessionUser } from "../../lib/auth";
import { generate } from "../../lib/generate";
import { consumeGeneration, refundGeneration } from "../../lib/usage";

const PREVIEW_COOKIE = "atom_free_preview_used";

function hasCookie(request: Request, name: string): boolean {
  const raw = request.headers.get("cookie");
  if (!raw) return false;
  return raw.split(";").some((part) => part.trim().startsWith(`${name}=`));
}

function previewCookie(secure: boolean): string {
  const maxAge = 365 * 24 * 60 * 60;
  return `${PREVIEW_COOKIE}=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  try {
    const body = (await request.json().catch(() => ({}))) as {
      prompt?: string;
      grade?: string;
      kind?: string;
      details?: string;
      diagrams?: string;
    };
    const input = {
      prompt: body.prompt ?? "",
      grade: body.grade,
      kind: body.kind,
      details: body.details,
      diagrams: body.diagrams,
    };

    if (!user) {
      if (hasCookie(request, PREVIEW_COOKIE)) {
        return Response.json(
          { error: "Your free preview is used. Sign in to make and download assignments." },
          { status: 429 },
        );
      }
      const result = await generate(null, input);
      if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
      const secure = new URL(request.url).protocol === "https:";
      return new Response(
        JSON.stringify({
          ok: true,
          content: result.content,
          usingOwnKey: false,
          signedIn: false,
          canDownload: false,
          remainingToday: 0,
          limit: 1,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": previewCookie(secure),
          },
        },
      );
    }

    const usage = await consumeGeneration(user.id);
    if (!usage.ok) {
      return Response.json(
        { error: "Daily free limit reached. Teachers can make 5 assignments per day.", ...usage },
        { status: 429 },
      );
    }
    const result = await generate(user.id, input);
    if (!result.ok) {
      await refundGeneration(user.id);
      return Response.json({ error: result.error }, { status: 400 });
    }
    return Response.json({
      ok: true,
      content: result.content,
      usingOwnKey: result.usingOwnKey,
      signedIn: true,
      canDownload: true,
      remainingToday: usage.remaining,
      limit: usage.limit,
    });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed." }, { status: 500 });
  }
}
