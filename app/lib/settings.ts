import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../db";
import { userSettings } from "../../db/schema";
import { ensureSchema } from "./auth";

type EnvBag = Record<string, string | undefined>;

export const DEFAULT_PROVIDER = "groq";
export const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";
export const DEFAULT_MODEL = "openai/gpt-oss-120b";
export const DEFAULT_OPTIMIZER_MODEL = "openai/gpt-oss-20b";

export type PublicSettings = { provider: string; baseUrl: string; model: string; hasKey: boolean };

/* ---------- AES-GCM key encryption ---------- */
function b64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function unb64(v: string): Uint8Array {
  const bin = atob(v);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function cryptoKey(): Promise<CryptoKey> {
  const raw = (env as unknown as EnvBag).APP_ENCRYPTION_KEY;
  let bytes: Uint8Array;
  if (raw) {
    const decoded = unb64(raw);
    bytes = decoded.length === 32 ? decoded : new Uint8Array(await crypto.subtle.digest("SHA-256", decoded as BufferSource));
  } else {
    console.warn("[atom-edu] APP_ENCRYPTION_KEY not set — using an insecure dev key. Set a real one in production.");
    bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("atom-edu-insecure-dev-key")));
  }
  return crypto.subtle.importKey("raw", bytes as BufferSource, "AES-GCM", false, ["encrypt", "decrypt"]);
}
async function encrypt(plain: string): Promise<string> {
  const key = await cryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain)));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv);
  out.set(ct, iv.length);
  return b64(out);
}
async function decrypt(enc: string): Promise<string | null> {
  try {
    const key = await cryptoKey();
    const data = unb64(enc);
    const iv = data.slice(0, 12);
    const ct = data.slice(12);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return new TextDecoder().decode(pt);
  } catch {
    return null;
  }
}

/* ---------- data access ---------- */
async function row(userId: string) {
  await ensureSchema();
  const db = getDb();
  const rows = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function getPublicSettings(userId: string): Promise<PublicSettings> {
  const r = await row(userId);
  return {
    provider: r?.provider ?? DEFAULT_PROVIDER,
    baseUrl: r?.baseUrl ?? DEFAULT_BASE_URL,
    model: r?.model ?? DEFAULT_MODEL,
    hasKey: Boolean(r?.apiKeyEnc),
  };
}

export type SaveInput = { provider: string; baseUrl: string; model: string; apiKey?: string };
export async function saveSettings(userId: string, input: SaveInput): Promise<void> {
  await ensureSchema();
  const db = getDb();
  const existing = await row(userId);
  // Keep the existing key when the form leaves the field blank.
  const apiKeyEnc = input.apiKey && input.apiKey.trim() ? await encrypt(input.apiKey.trim()) : existing?.apiKeyEnc ?? null;
  const provider = input.provider || DEFAULT_PROVIDER;
  const baseUrl = input.baseUrl || DEFAULT_BASE_URL;
  const model = input.model || DEFAULT_MODEL;
  if (existing) {
    await db.update(userSettings).set({ provider, baseUrl, model, apiKeyEnc }).where(eq(userSettings.userId, userId));
  } else {
    await db.insert(userSettings).values({ userId, provider, baseUrl, model, apiKeyEnc });
  }
}

export async function clearKey(userId: string): Promise<void> {
  await ensureSchema();
  const db = getDb();
  await db.update(userSettings).set({ apiKeyEnc: null }).where(eq(userSettings.userId, userId));
}

/** Returns the user's own decrypted key, or the shared free-allowance key, or null. */
export async function resolveApiKey(userId: string): Promise<{ key: string | null; usingOwnKey: boolean; baseUrl: string; model: string }> {
  const r = await row(userId);
  const baseUrl = r?.baseUrl ?? DEFAULT_BASE_URL;
  const model = r?.model ?? DEFAULT_MODEL;
  if (r?.apiKeyEnc) {
    const key = await decrypt(r.apiKeyEnc);
    if (key) return { key, usingOwnKey: true, baseUrl, model };
  }
  const shared = (env as unknown as EnvBag).GROQ_API_KEY ?? (env as unknown as EnvBag).OPENAI_API_KEY ?? null;
  return { key: shared, usingOwnKey: false, baseUrl, model };
}

export function resolveSharedApiKey(): {
  key: string | null;
  baseUrl: string;
  model: string;
  optimizerModel: string;
} {
  const bag = env as unknown as EnvBag;
  return {
    key: bag.GROQ_API_KEY ?? bag.OPENAI_API_KEY ?? null,
    baseUrl: bag.GROQ_BASE_URL ?? DEFAULT_BASE_URL,
    model: bag.GROQ_MODEL ?? DEFAULT_MODEL,
    optimizerModel: bag.GROQ_OPTIMIZER_MODEL ?? DEFAULT_OPTIMIZER_MODEL,
  };
}
