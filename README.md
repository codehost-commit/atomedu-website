# Atom Edu

Atom Edu is a free assignment workbench for teachers. The current app lets a
visitor generate one AI worksheet preview before signing in. Signed-in teachers
can generate, save, and download PDFs, with the shared free AI allowance capped
at 5 assignments per teacher per UTC day.

## Stack

- Vinext / React app in `app/`
- Cloudflare Workers runtime
- Cloudflare D1 binding named `DB`
- Drizzle schema in `db/schema.ts`
- Groq through the OpenAI-compatible chat completions API

## Local Development

```bash
npm install
npm run dev
npm run build
```

## Required Cloudflare Secrets

Set these in the Cloudflare project before production deploy:

```bash
wrangler secret put GROQ_API_KEY
wrangler secret put APP_ENCRYPTION_KEY
```

Use the Groq key value when `wrangler` asks for `GROQ_API_KEY`. Do not commit it.

Generate the encryption key with:

```bash
openssl rand -base64 32
```

Optional overrides:

```bash
wrangler secret put GROQ_MODEL
wrangler secret put GROQ_OPTIMIZER_MODEL
wrangler secret put ADMIN_EMAILS
```

Recommended defaults:

- `GROQ_MODEL=openai/gpt-oss-120b`
- `GROQ_OPTIMIZER_MODEL=openai/gpt-oss-20b`
- `ADMIN_EMAILS=you@example.com,cofounder@example.com`

## Cloudflare Bindings

The app expects a D1 binding named `DB`. D1 stores:

- email/password accounts
- sessions
- encrypted user AI settings
- saved assignments
- daily generation usage

R2 is not required for the current PDF flow because PDFs are generated on demand
and downloaded immediately. Use R2 later if Atom Edu needs permanent file
storage for generated PDFs, uploaded source documents, or classroom assets.

## Account Ownership Transfer

Cloudflare account/project ownership cannot be transferred from source code.
The current owner has to invite the target Cloudflare account from the
Cloudflare dashboard, grant the needed account/project permissions, then move or
recreate the Pages/Workers/D1 resources under the correct account if necessary.

## GitHub Hosting Flow

Push this repo to GitHub, then connect the GitHub repository to Cloudflare Pages
or Workers builds. Keep secrets in Cloudflare, not GitHub. GitHub should hold
source code only.

Repository:

```bash
git remote add origin https://github.com/codehost-commit/atomedu-website.git
git push -u origin main
```
