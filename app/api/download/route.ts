import { getSessionUser } from "../../lib/auth";
import { createWorksheetPdf } from "../../lib/pdf";

function fileName(title: string): string {
  const safe = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return `${safe || "atom-edu-assignment"}.pdf`;
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Sign in required to download PDFs." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { title?: string; content?: string };
  const content = body.content?.trim();
  if (!content) return Response.json({ error: "No worksheet content to download." }, { status: 400 });

  const title = body.title?.trim() || "Atom Edu Assignment";
  const pdf = createWorksheetPdf(title, content);
  return new Response(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName(title)}"`,
      "Cache-Control": "no-store",
    },
  });
}
