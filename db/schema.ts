import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Application users. passwordHash is null for accounts created via magic link only.
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Server-side sessions. The cookie holds only the random session id.
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Single-use, short-lived magic-link tokens.
export const magicTokens = sqliteTable("magic_tokens", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  expiresAt: integer("expires_at").notNull(),
  consumedAt: integer("consumed_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Per-user AI settings. apiKeyEnc is AES-GCM encrypted; never stored in plaintext.
export const userSettings = sqliteTable("user_settings", {
  userId: text("user_id").primaryKey(),
  provider: text("provider").notNull().default("groq"),
  baseUrl: text("base_url").notNull().default("https://api.groq.com/openai/v1"),
  model: text("model").notNull().default("openai/gpt-oss-120b"),
  apiKeyEnc: text("api_key_enc"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// One row per teacher per UTC day. This enforces the shared free compute limit.
export const generationUsage = sqliteTable("generation_usage", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  day: text("day").notNull(),
  count: integer("count").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Saved teacher-generated work.
export const assignments = sqliteTable("assignments", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  kind: text("kind").notNull().default("assignment"),
  prompt: text("prompt").notNull().default(""),
  content: text("content").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
