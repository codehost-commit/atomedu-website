import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../../db";
import { generationUsage } from "../../db/schema";
import { ensureSchema } from "./auth";

export const DAILY_ASSIGNMENT_LIMIT = 5;

function dayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export async function getGenerationUsage(userId: string): Promise<{
  limit: number;
  used: number;
  remaining: number;
  day: string;
}> {
  await ensureSchema();
  const db = getDb();
  const day = dayKey();
  const rows = await db
    .select()
    .from(generationUsage)
    .where(and(eq(generationUsage.userId, userId), eq(generationUsage.day, day)))
    .limit(1);
  const used = rows[0]?.count ?? 0;
  return {
    limit: DAILY_ASSIGNMENT_LIMIT,
    used,
    remaining: Math.max(0, DAILY_ASSIGNMENT_LIMIT - used),
    day,
  };
}

export async function consumeGeneration(userId: string): Promise<{
  ok: boolean;
  limit: number;
  used: number;
  remaining: number;
  day: string;
}> {
  await ensureSchema();
  const db = getDb();
  const day = dayKey();
  const existing = await getGenerationUsage(userId);
  if (existing.used >= DAILY_ASSIGNMENT_LIMIT) return { ok: false, ...existing };

  const rows = await db
    .select()
    .from(generationUsage)
    .where(and(eq(generationUsage.userId, userId), eq(generationUsage.day, day)))
    .limit(1);

  if (rows[0]) {
    await db
      .update(generationUsage)
      .set({ count: rows[0].count + 1, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(generationUsage.id, rows[0].id));
  } else {
    await db.insert(generationUsage).values({
      id: crypto.randomUUID(),
      userId,
      day,
      count: 1,
    });
  }

  const next = await getGenerationUsage(userId);
  return { ok: true, ...next };
}

export async function refundGeneration(userId: string): Promise<void> {
  await ensureSchema();
  const db = getDb();
  const day = dayKey();
  const rows = await db
    .select()
    .from(generationUsage)
    .where(and(eq(generationUsage.userId, userId), eq(generationUsage.day, day)))
    .limit(1);
  const row = rows[0];
  if (!row || row.count <= 0) return;
  await db
    .update(generationUsage)
    .set({ count: row.count - 1, updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(generationUsage.id, row.id));
}
