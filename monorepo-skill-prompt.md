# Skill Prompt — Production npm-Workspaces Monorepo (API + Web + Shared Types)

> Use this file as the body of a `SKILL.md`. Suggested frontmatter:
>
> ```yaml
> ---
> name: monorepo-setup
> description: Scaffold a production npm-workspaces monorepo from scratch — apps/api (Node.js + Express + Prisma), apps/web (Next.js), packages/types (the single shared home for every DTO, model, filter param, enum and Zod validator used by both apps). Covers root script orchestration, the shared types package (CommonJS build, prepare script, runtime dependency), build order, CI (typecheck/lint/build with boot-env stubs and Prisma migration drift check), per-app .env.example discipline, and platform deployment rules. Use when the user wants to "create a monorepo", "set up a fullstack project", "share types between frontend and backend", or restructure an app pair into workspaces.
> ---
> ```

---

## THE PROMPT

You are setting up a **production fullstack monorepo** in Node.js. Use plain **npm workspaces** — no Turborepo/Nx unless asked. The root orchestrates; each workspace owns its own build. The defining feature is a **shared types package** that both apps consume, so a request body, response DTO or Zod rule is written exactly once.

### 1. Layout

```
<project>/
  package.json                 # root: workspaces + orchestration scripts only, no app code
  .github/workflows/ci.yml
  .prettierrc                  # one style for every workspace (e.g. semi, singleQuote, printWidth 150)
  apps/
    api/                       # Express + Prisma backend (own package.json, tsconfig, .env.example)
    web/                       # Next.js frontend  (own package.json, tsconfig, .env.example)
  packages/
    types/                     # @<scope>/types — shared dto/model/params/enum/validator
```

Workspace names are scoped: `@<scope>/api`, `@<scope>/web`, `@<scope>/types`. Internal imports always use the package name (`@<scope>/types`), never a relative `../../packages/...` path — relative cross-package paths do not exist inside platform build containers (Vercel copies only the configured root directory plus workspace links).

### 2. Root `package.json`

```jsonc
{
  "name": "<project>",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev":        "concurrently -n api,web -c blue,green \"npm run dev:api\" \"npm run dev:web\"",
    "dev:web":    "npm run dev -w @<scope>/web",
    "dev:api":    "npm run dev -w @<scope>/api",
    "build":      "npm run build:types && npm run build -w @<scope>/api && npm run build -w @<scope>/web",
    "build:types": "npm run build -w @<scope>/types",
    "build:api":  "npm run build:types && npm run build -w @<scope>/api",
    "build:web":  "npm run build:types && npm run build -w @<scope>/web",
    "typecheck":  "npm run typecheck -w @<scope>/api && npm run typecheck -w @<scope>/web",
    "lint":       "npm run lint -w @<scope>/web",
    "start:api":  "npm run start -w @<scope>/api",
    "migrate:deploy": "npm run migrate:deploy -w @<scope>/api"
  },
  "devDependencies": { "concurrently": "^10", "prettier": "^3", "typescript": "5.x" },
  "overrides": { "@types/react": "^18", "@types/react-dom": "^18" },
  "engines": { "node": ">=20" }
}
```

Rules:
- **Build order is types → api → web, always.** Each `build:<app>` script rebuilds types first so a cold CI container or fresh checkout never sees a missing `dist/`.
- Pin one TypeScript version at the root; use `overrides` to stop duplicate `@types/react` majors from hoisting conflicts.
- Database migrations are a **separate command** (`migrate:deploy`), never part of `build` — a build must be reproducible without touching the DB.

### 3. The shared types package (the heart of the monorepo)

`packages/types` is the **single home for every DTO (response shape), model (request body), filter param, enum, and Zod validator** shared between api and web. Neither app keeps local `dtos/`, `models/`, `params/` or `enums/` folders.

`package.json`:

```jsonc
{
  "name": "@<scope>/types",
  "version": "1.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "prepare": "tsc",                                  // builds itself on every `npm install`
    "build": "tsc",
    "dev": "tsc --watch --preserveWatchOutput",
    "clean": "node -e \"require('fs').rmSync('dist',{recursive:true,force:true})\""
  },
  "dependencies": { "zod": "^4" },                     // validators execute at runtime
  "devDependencies": { "typescript": "5.x" }
}
```

`tsconfig.json`: `"module": "CommonJS"`, `"moduleResolution": "node"`, `declaration: true`, `outDir: dist`, `rootDir: src`. **CommonJS is deliberate**: an ESNext build emits extensionless ESM imports that `node dist/index.js` in the API cannot resolve at runtime.

Source layout and conventions:

```
src/
  dto/<entity>.dto.ts        # XDto — response shapes; timestamps typed `Date | string`
                             #   (server builds from Prisma Date, browser receives ISO strings)
  model/<entity>.model.ts    # Create<X>Model — request bodies
  params/<entity>.params.ts  # XFilterParams extends PageFilterParams (page, recordPerPage,
                             #   search, showAllRecords, sortBy, sortDirection, dates)
  enum/<name>.enum.ts        # string-union type + matching runtime enum pair:
                             #   type Status = 'Published'|'Draft'|'Trash'  +  enum StatusEnum {...}
                             #   DTO fields use the union (DB enum values assign directly);
                             #   components compare against the runtime enum
  validator/<entity>.validator.ts  # flat Zod field schema shared by web forms (react-hook-form
                             #   resolver gets flat values) + API-wrapped exports:
                             #   XValidator = z.object({ body: xFields });
                             #   updateXValidator = z.object({ body: xFields.partial() })
  common/                    # CustomResponse<T> { success, message, data?, errors? },
                             #   ListResponseDto<T> { totalRecord, data }, PageFilterParams
  index.ts                   # hand-picked exports — an unexported type is invisible to both apps
```

Hard rules:
- It is a **runtime `dependency`** of both apps (validators execute on the API), not a devDependency.
- **Never import `@<scope>/types` from inside the package itself** — use relative paths, or the first build of a clean checkout fails (the package resolves to its own not-yet-built `dist`).
- Every new type is exported from `src/index.ts` **in the same commit** that creates it.
- After editing anything under `packages/types/src`, run `npm run build:types` or the apps see stale types *and* stale runtime validators. In dev, the API's file-watcher does not watch the package — restart/nudge it after a types rebuild.
- The only acceptable exception to "everything shared lives here": a type that references a framework type (e.g. a React `ReactNode` in a dropdown option) stays in the app that needs it — the package must stay framework-free.

### 4. Per-app conventions

- Each app owns a complete `.env.example` listing **every** key it reads; a new env var lands in `.env.example` + the app's env loader in the same commit.
- `apps/api` validates its environment with Zod **at import time** and refuses to boot otherwise (see the API skill).
- `apps/web` centralizes env in one `src/config/index.ts`; only `NEXT_PUBLIC_*` values are client-safe; secrets never get that prefix (see the frontend skill).
- One Prettier style across all workspaces; the web app's `next build` gates on ESLint (`ignoreDuringBuilds: false`), so `lint` must stay at zero errors.
- No test runner unless the project adds one — do not assume `npm test` exists.

### 5. CI (`.github/workflows/ci.yml`)

Run on every push to main and every PR: typecheck, lint, and **both builds**. Key patterns:

```yaml
jobs:
  verify:
    runs-on: ubuntu-latest
    env:
      # The API validates env at import time, so the BUILD needs plausible values
      # even though nothing connects:
      NODE_ENV: test
      DATABASE_URL: postgresql://ci:ci@localhost:5432/ci
      JWT_SECRET: ci-only-secret-value-at-least-32-characters-long
      CORS_ORIGINS: http://localhost:3000
      # Next.js inlines NEXT_PUBLIC_* at build time:
      NEXT_PUBLIC_API_BASE_URL: http://localhost:4000
      NEXTAUTH_URL: http://localhost:3000
      NEXTAUTH_SECRET: ci-only-nextauth-secret
    steps:
      - checkout; setup-node (cache: npm); npm ci
      - run: npm run build:types        # shared types first — both apps resolve its dist/
      - run: npx prisma generate
        working-directory: apps/api
      # Catch a schema edited without a migration before `migrate deploy` breaks in prod:
      - run: npx prisma migrate diff --from-migrations prisma/migrations
             --to-schema-datamodel prisma/schema.prisma --exit-code
        working-directory: apps/api
      - npm run typecheck; npm run lint; npm run build:api; npm run build:web
```

Use `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }` so pushes supersede running jobs.

### 6. Deployment (Vercel or similar)

- **One platform project per app** (`<project>-api`, `<project>-web`), each with its Root Directory set to `apps/api` / `apps/web`. The platform installs from the repo root (workspaces resolve), but the build command must be workspace-aware: e.g. build command `cd ../.. && npm run build:api` or an app-local script that never uses `../../packages/...` paths.
- Because `packages/types` has a `prepare` script, `npm install` builds it automatically in the container — this is what makes cold deploys work.
- Run `migrate:deploy` as a separate step (manually or a deploy hook), never inside the build.
- Keep serverless compatibility in the API: export the Express `app` and only `listen` when `require.main === module`.
- Environment variables are configured per platform project; mirror `.env.example` exactly and keep production guards (no wildcard CORS, no dev-bypass flags) in the API's env validator.

### 7. From-scratch checklist

1. `git init`, root `package.json` (workspaces + scripts above), root tsconfig base if desired, `.prettierrc`, `.gitignore` (`node_modules`, `dist`, `.next`, `.env*` except `.env.example`).
2. Scaffold `packages/types` (package.json, CommonJS tsconfig, `src/{dto,model,params,enum,validator,common}/`, `index.ts`) with `CustomResponse`, `ListResponseDto`, `PageFilterParams`, `Role` enum pair.
3. Scaffold `apps/api` per the API skill; add `@<scope>/types` as a dependency (`npm i @<scope>/types -w @<scope>/api` or declare `"@<scope>/types": "*"`).
4. Scaffold `apps/web` per the frontend skill; same dependency.
5. `npm install` at the root once — verify the types package built itself (`packages/types/dist/` exists).
6. `npm run typecheck && npm run build` green, `npm run dev` starts both apps.
7. Add the CI workflow; push; verify it passes on a clean container (this is the test that catches every "works on my machine" workspace mistake).

### 8. Definition of done

- A **fresh clone + `npm ci` + `npm run build`** succeeds with no manual steps.
- No type, enum, validator or request/response shape exists in two places.
- `grep -r "\.\./\.\./packages" apps/` returns nothing.
- CI runs typecheck + lint + both builds and the Prisma migration-drift check.
