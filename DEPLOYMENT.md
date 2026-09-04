# Deployment

Both apps deploy to Vercel as separate projects from this one repository. The API is
an Express app exported as a serverless function; the web app is a standard Next.js
deployment.

## Before the first deploy

1. **Rotate the leaked Font Awesome token.** `apps/web/.npmrc` was committed with a
   registry auth token (commit `6ff6afa`). The file is removed and `.npmrc` is now
   gitignored, but the token is still in git history — revoke it in the Font Awesome
   account. Nothing in the repo uses `@fortawesome`, so no replacement is needed.
2. **Generate real secrets.** Neither app boots with the placeholder values in the
   `.env.example` files:
   - `JWT_SECRET` — `openssl rand -base64 48` (must be ≥ 32 chars)
   - `CLIENT_ID` / `NEXT_PUBLIC_API_CLIENT_ID` — `openssl rand -hex 24`, identical on both sides
   - `NEXTAUTH_SECRET` — `openssl rand -base64 32`
3. **Use a pooled database URL for the API.** Serverless functions open a connection
   per instance. Point `DATABASE_URL` at a pooler (Supabase's port-6543 pooler, Neon's
   pooled endpoint, PgBouncer, or Prisma Accelerate) and `DIRECT_URL` at the direct
   connection for migrations.

## apps/api on Vercel

`apps/api/vercel.json` carries the install/build commands and routes every request to
the serverless entry `apps/api/api/index.js`, which re-exports the compiled app from
`dist/`. Do **not** reintroduce the legacy `builds` key: when it is present Vercel
ignores the install command and runs `npm install` inside `apps/api` alone, which then
tries to fetch `@pms/types` from the public registry and fails with a 404.

| Setting          | Value                                        |
| ---------------- | -------------------------------------------- |
| Root Directory   | `apps/api`                                   |
| Framework Preset | Other                                        |
| Install Command  | *(from vercel.json: `cd ../.. && npm ci`)*   |
| Build Command    | *(from vercel.json: `npm run vercel-build`)* |
| Node.js Version  | 20.x (pinned in `engines`)                   |

Under **Settings -> General**, keep *"Include source files outside of the Root Directory
in the Build Step"* enabled: the install runs from the repo root and the build compiles
`packages/types`.

Environment variables - every key in `apps/api/.env.example`. Production-specific:

```
NODE_ENV=production
SITE_MODE=                 # must be empty; `local` is refused at boot in production
CORS_ORIGINS=https://your-web-domain.com
APP_PUBLIC_URL=https://your-web-domain.com
ENABLE_API_DOCS=false      # Swagger off unless you want /api public
TRUST_PROXY_HOPS=1
DATABASE_URL=<pooled url>  # PgBouncer / Supabase 6543 / Neon pooled / Accelerate
DIRECT_URL=<direct url>
```

Run migrations as a separate step, not in the build (the build runs on every preview
deploy and must not touch the production database):

```bash
cd apps/api
DATABASE_URL=<direct url> npx prisma migrate deploy
```

Health probes — mounted *before* the `clientId` gate so monitors need no secret:

- `GET /health/live` → `200 {"status":"UP"}` (process is up)
- `GET /health/ready` → `200 {"status":"READY"}` or `503` (runs `SELECT 1` against Postgres)

Every response carries an `x-request-id`; a 500 also returns it as `errorCode`. Search
the Vercel function logs for that id to find the stack trace.

## apps/web on Vercel

| Setting          | Value                    |
| ---------------- | ------------------------ |
| Root Directory   | `apps/web`               |
| Framework Preset | Next.js                  |
| Install Command  | `cd ../.. && npm ci`     |
| Build Command    | `npm run build`          |

Environment variables — every key in `apps/web/.env.example`. `NEXTAUTH_URL` must be
the final public URL (including a custom domain if you attach one), and
`NEXT_PUBLIC_API_BASE_URL` must be the API's public URL with no trailing slash.

Security headers (HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`,
`Permissions-Policy`) are set in `next.config.mjs` and apply on Vercel without extra
configuration.

## Running it yourself instead of Vercel

The API is a plain Node process when started directly:

```bash
npm run build            # types → api → web
npm run migrate:deploy   # prisma migrate deploy
npm run start:api        # node apps/api/dist/index.js  (handles SIGTERM, drains, disconnects Prisma)
npm run start:web        # next start
```

Set `TRUST_PROXY_HOPS` to the number of reverse proxies in front of the API (0 if
none). Getting it wrong either lets clients spoof their IP to the rate limiter or
collapses every caller into one rate-limit bucket.

## What CI checks

`.github/workflows/ci.yml` runs on every push and pull request: `npm ci`, build
`@pms/types`, `prisma generate`, typecheck both apps, lint the web app, build both
apps. It also runs `prisma migrate diff` to warn when `schema.prisma` has drifted
from the committed migrations (advisory only — no database is available in CI).
