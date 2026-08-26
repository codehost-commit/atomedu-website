import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { getDb } from "../../db";
import { magicTokens, sessions, users } from "../../db/schema";

export const SESSION_COOKIE = "atom_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAGIC_TTL_MS = 15 * 60 * 1000; // 15 minutes

const textEncoder = new TextEncoder();

/* ---------- schema bootstrap (self-provisioning, idempotent) ---------- */
let schemaReady = false;
export async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  const db = getDb();
  await db.run(sql`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    name TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS magic_tokens (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    consumed_at INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY,
    provider TEXT NOT NULL DEFAULT 'groq',
    base_url TEXT NOT NULL DEFAULT 'https://api.groq.com/openai/v1',
    model TEXT NOT NULL DEFAULT 'openai/gpt-oss-120b',
    api_key_enc TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS generation_usage (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    day TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, day)
  )`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'assignment',
    prompt TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  schemaReady = true;
}

/* ---------- encoding + random ---------- */
function toB64Url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function toB64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function fromB64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
export function randomToken(bytes = 32): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return toB64Url(a);
}

/* ---------- password hashing (PBKDF2 / WebCrypto) ---------- */
async function deriveBits(password: string, salt: Uint8Array, iterations: number): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey("raw", textEncoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits({ name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" }, key, 256);
}
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 100_000;
  const bits = new Uint8Array(await deriveBits(password, salt, iterations));
  return `pbkdf2$${iterations}$${toB64(salt)}$${toB64(bits)}`;
}
export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = parseInt(parts[1], 10);
  if (!Number.isFinite(iterations)) return false;
  const salt = fromB64(parts[2]);
  const expected = fromB64(parts[3]);
  const actual = new Uint8Array(await deriveBits(password, salt, iterations));
  return timingSafeEqual(actual, expected);
}
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a[i] ^ b[i];
  return r === 0;
}

/* ---------- validation ---------- */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

/* ---------- users ---------- */
export type UserRow = { id: string; email: string; passwordHash: string | null; name: string | null };
export async function findUserByEmail(email: string): Promise<UserRow | null> {
  await ensureSchema();
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const u = rows[0];
  return u ? { id: u.id, email: u.email, passwordHash: u.passwordHash, name: u.name } : null;
}
export async function createUser(email: string, passwordHash: string | null, name: string | null): Promise<UserRow> {
  await ensureSchema();
  const db = getDb();
  const id = crypto.randomUUID();
  await db.insert(users).values({ id, email, passwordHash, name });
  return { id, email, passwordHash, name };
}

/* ---------- sessions ---------- */
export async function createSession(userId: string): Promise<{ id: string; maxAgeMs: number }> {
  await ensureSchema();
  const db = getDb();
  const id = randomToken(32);
  const expiresAt = Date.now() + SESSION_TTL_MS;
  await db.insert(sessions).values({ id, userId, expiresAt });
  return { id, maxAgeMs: SESSION_TTL_MS };
}
export async function deleteSession(id: string): Promise<void> {
  await ensureSchema();
  const db = getDb();
  await db.delete(sessions).where(eq(sessions.id, id));
}

export type SafeUser = { id: string; email: string; name: string | null; isAdmin: boolean };
export async function getSessionUser(): Promise<SafeUser | null> {
  try {
    const jar = await cookies();
    const sid = jar.get(SESSION_COOKIE)?.value;
    if (!sid) return null;
    await ensureSchema();
    const db = getDb();
    const rows = await db
      .select({ uid: users.id, email: users.email, name: users.name, expiresAt: sessions.expiresAt })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(eq(sessions.id, sid))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    if (row.expiresAt < Date.now()) {
      await db.delete(sessions).where(eq(sessions.id, sid));
      return null;
    }
    return { id: row.uid, email: row.email, name: row.name, isAdmin: isAdminEmail(row.email) };
  } catch {
    // DB not configured yet, etc. — treat as signed out rather than crashing pages.
    return null;
  }
}

export function readSessionId(request: Request): string | null {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;
  for (const part of cookie.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    if (k === SESSION_COOKIE) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

/* ---------- cookies ---------- */
export function sessionCookie(id: string, maxAgeMs: number, secure: boolean): string {
  const maxAge = Math.floor(maxAgeMs / 1000);
  return `${SESSION_COOKIE}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}
export function clearSessionCookie(secure: boolean): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
}

/* ---------- magic-link tokens ---------- */
export async function createMagicToken(email: string): Promise<string> {
  await ensureSchema();
  const db = getDb();
  const id = randomToken(32);
  await db.insert(magicTokens).values({ id, email, expiresAt: Date.now() + MAGIC_TTL_MS });
  return id;
}
export async function consumeMagicToken(id: string): Promise<string | null> {
  await ensureSchema();
  const db = getDb();
  const rows = await db.select().from(magicTokens).where(eq(magicTokens.id, id)).limit(1);
  const t = rows[0];
  if (!t || t.consumedAt || t.expiresAt < Date.now()) return null;
  await db.update(magicTokens).set({ consumedAt: Date.now() }).where(eq(magicTokens.id, id));
  return t.email;
}

export async function requireUser(next = "/"): Promise<SafeUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/* ---------- admin ---------- */
type EnvBag = Record<string, string | undefined>;
export function isAdminEmail(email: string): boolean {
  const raw = (env as unknown as EnvBag).ADMIN_EMAILS ?? "";
  const list = raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}
export async function requireAdmin(): Promise<SafeUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (!user.isAdmin) redirect("/");
  return user;
}
