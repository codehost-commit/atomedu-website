import { and, count, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { getDb } from "../../db";
import { magicTokens, sessions, users } from "../../db/schema";
import { ensureSchema } from "./auth";

export type AdminStats = {
  totalUsers: number;
  passwordUsers: number;
  magicOnlyUsers: number;
  newUsers7d: number;
  activeSessions: number;
  pendingMagicLinks: number;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  hasPassword: boolean;
  activeSessions: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  await ensureSchema();
  const db = getDb();
  const now = Date.now();
  const [total] = await db.select({ c: count() }).from(users);
  const [withPw] = await db.select({ c: count() }).from(users).where(sql`password_hash IS NOT NULL`);
  const [new7d] = await db.select({ c: count() }).from(users).where(sql`created_at >= datetime('now','-7 days')`);
  const [active] = await db.select({ c: count() }).from(sessions).where(gt(sessions.expiresAt, now));
  const [pending] = await db
    .select({ c: count() })
    .from(magicTokens)
    .where(and(isNull(magicTokens.consumedAt), gt(magicTokens.expiresAt, now)));

  const totalUsers = total?.c ?? 0;
  const passwordUsers = withPw?.c ?? 0;
  return {
    totalUsers,
    passwordUsers,
    magicOnlyUsers: totalUsers - passwordUsers,
    newUsers7d: new7d?.c ?? 0,
    activeSessions: active?.c ?? 0,
    pendingMagicLinks: pending?.c ?? 0,
  };
}

export async function listUsers(limit = 100): Promise<AdminUser[]> {
  await ensureSchema();
  const db = getDb();
  const now = Date.now();
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      createdAt: users.createdAt,
      passwordHash: users.passwordHash,
      activeSessions: sql<number>`(SELECT COUNT(*) FROM sessions WHERE sessions.user_id = users.id AND sessions.expires_at > ${now})`,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    createdAt: r.createdAt,
    hasPassword: r.passwordHash !== null,
    activeSessions: Number(r.activeSessions ?? 0),
  }));
}

export async function revokeUserSessions(userId: string): Promise<void> {
  await ensureSchema();
  const db = getDb();
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export async function deleteUserById(userId: string): Promise<void> {
  await ensureSchema();
  const db = getDb();
  await db.delete(sessions).where(eq(sessions.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
}
