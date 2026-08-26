import { desc, eq } from "drizzle-orm";
import { getDb } from "../../db";
import { assignments } from "../../db/schema";
import { ensureSchema } from "./auth";

export type AssignmentRow = { id: string; title: string; kind: string; prompt: string; content: string; createdAt: string };

export async function saveAssignment(userId: string, data: { title: string; kind: string; prompt: string; content: string }): Promise<string> {
  await ensureSchema();
  const db = getDb();
  const id = crypto.randomUUID();
  await db.insert(assignments).values({
    id,
    userId,
    title: data.title.slice(0, 200) || "Untitled",
    kind: data.kind || "assignment",
    prompt: data.prompt.slice(0, 4000),
    content: data.content,
  });
  return id;
}

export async function listAssignments(userId: string, limit = 50): Promise<AssignmentRow[]> {
  await ensureSchema();
  const db = getDb();
  const rows = await db
    .select({ id: assignments.id, title: assignments.title, kind: assignments.kind, prompt: assignments.prompt, content: assignments.content, createdAt: assignments.createdAt })
    .from(assignments)
    .where(eq(assignments.userId, userId))
    .orderBy(desc(assignments.createdAt))
    .limit(limit);
  return rows;
}

export async function countAssignments(userId: string): Promise<number> {
  const rows = await listAssignments(userId, 1000);
  return rows.length;
}
