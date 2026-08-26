import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("homepage leads with the free worksheet preview", async () => {
  const page = await source("app/page.tsx");
  assert.match(page, /Printable assignments from a rough idea\./);
  assert.match(page, /<CreateForm signedIn=\{false\} compact \/>/);
  assert.match(page, /One free AI preview, no account\./);
  assert.match(page, /5<\/b> assignments\/day/);
});

test("generation flow enforces preview and teacher limits", async () => {
  const route = await source("app/api/generate/route.ts");
  const usage = await source("app/lib/usage.ts");
  const form = await source("app/components/CreateForm.tsx");

  assert.match(route, /atom_free_preview_used/);
  assert.match(route, /consumeGeneration\(user\.id\)/);
  assert.match(route, /canDownload:\s*false/);
  assert.match(route, /canDownload:\s*true/);
  assert.match(usage, /DAILY_ASSIGNMENT_LIMIT = 5/);
  assert.match(form, /Sign in to download/);
  assert.match(form, /Download PDF/);
});

test("groq and pdf support are wired without committing secrets", async () => {
  const settings = await source("app/lib/settings.ts");
  const generate = await source("app/lib/generate.ts");
  const download = await source("app/api/download/route.ts");
  const all = [
    await source("app/lib/settings.ts"),
    await source("app/lib/generate.ts"),
    await source("README.md"),
  ].join("\n");

  assert.match(settings, /GROQ_API_KEY/);
  assert.match(settings, /openai\/gpt-oss-120b/);
  assert.match(generate, /Use LaTeX for all math, chemistry, and physics notation/);
  assert.match(generate, /DIAGRAM SPEC/);
  assert.match(download, /Sign in required to download PDFs/);
  assert.doesNotMatch(all, /gsk_[A-Za-z0-9]+/);
});
