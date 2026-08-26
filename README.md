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

## Important: GitHub Pages vs Backend

Plain GitHub Pages cannot run the current Atom Edu app by itself. GitHub Pages is
static hosting only, so it cannot safely hold `GROQ_API_KEY`, run email/password
auth, write to D1, enforce the 5-per-day teacher limit, or generate private PDFs.

Use GitHub for source control. Use Cloudflare Pages/Workers for the live app
runtime if you want the AI/account/PDF features to work.

If you still point `atom-edu.org` directly to GitHub Pages, it should be treated
as a static marketing/demo site unless the backend is split out separately.

## Cloudflare Project Setup Commands

Run these from the project root, not from `worker/`:

```bash
cd /Users/rahul/Projects/Atom\ Edu/atom-edu-website-main
```

Use `npx wrangler`, not bare `wrangler`. On this machine, bare `wrangler` is a
broken global Python package. `npx wrangler` uses the real Node Wrangler from
this project.

Create/login:

```bash
npx wrangler login
npx wrangler pages project create atom-edu --production-branch main
```

Create the D1 database:

```bash
npx wrangler d1 create atom-edu-db
```

In the Cloudflare dashboard, bind that D1 database to the Pages project with:

- Binding / variable name: `DB`
- Database: `atom-edu-db`

Then set secrets:

```bash
npx wrangler pages secret put GROQ_API_KEY --project-name atom-edu
openssl rand -base64 32
npx wrangler pages secret put APP_ENCRYPTION_KEY --project-name atom-edu
```

Optional:

```bash
npx wrangler pages secret put GROQ_MODEL --project-name atom-edu
npx wrangler pages secret put GROQ_OPTIMIZER_MODEL --project-name atom-edu
npx wrangler pages secret put ADMIN_EMAILS --project-name atom-edu
```

The error `Must specify a project name` means either the Pages project does not
exist yet or the command needs `--project-name atom-edu`.

## Required Cloudflare Secrets

Set these in the Cloudflare project before production deploy if using Workers:

```bash
wrangler secret put GROQ_API_KEY
wrangler secret put APP_ENCRYPTION_KEY
```

For Cloudflare Pages, use:

```bash
npx wrangler pages secret put GROQ_API_KEY --project-name atom-edu
npx wrangler pages secret put APP_ENCRYPTION_KEY --project-name atom-edu
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

## GitHub Pages DNS For atom-edu.org

In GitHub:

1. Go to `codehost-commit/atomedu-website` -> Settings -> Pages.
2. Set the custom domain to `atom-edu.org`.
3. Enable HTTPS once GitHub allows it.

In GoDaddy DNS, remove conflicting parked/forwarding records for `@` or `www`,
then add:

| Type | Name | Value | TTL |
| --- | --- | --- | --- |
| A | `@` | `185.199.108.153` | Default / 1 hour |
| A | `@` | `185.199.109.153` | Default / 1 hour |
| A | `@` | `185.199.110.153` | Default / 1 hour |
| A | `@` | `185.199.111.153` | Default / 1 hour |
| CNAME | `www` | `codehost-commit.github.io` | Default / 1 hour |

Optional IPv6 records:

| Type | Name | Value | TTL |
| --- | --- | --- | --- |
| AAAA | `@` | `2606:50c0:8000::153` | Default / 1 hour |
| AAAA | `@` | `2606:50c0:8001::153` | Default / 1 hour |
| AAAA | `@` | `2606:50c0:8002::153` | Default / 1 hour |
| AAAA | `@` | `2606:50c0:8003::153` | Default / 1 hour |

Do not add wildcard DNS records like `*.atom-edu.org`.

Verify later:

```bash
dig atom-edu.org +noall +answer -t A
dig www.atom-edu.org +noall +answer
```

DNS can take up to 24 hours to settle.

## GitHub Source Flow

Push this repo to GitHub, then connect the GitHub repository to Cloudflare Pages
or Workers builds. Keep secrets in Cloudflare, not GitHub. GitHub should hold
source code only.

Repository:

```bash
git remote add origin https://github.com/codehost-commit/atomedu-website.git
git push -u origin main
```
