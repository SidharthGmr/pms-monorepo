# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

PMS is an npm-workspaces monorepo for a multi-store Product/Inventory Management System:

- `apps/api` — Express 5 + TypeScript + Prisma/PostgreSQL REST API (InversifyJS DI, layered architecture).
- `apps/web` — Next.js 14 (App Router) frontend, NextAuth for session/JWT handling, Redux Toolkit + React Query, shadcn/ui + Radix components, Tailwind.
- `packages/types` (`@pms/types`) — small set of DTOs/params/Zod validators shared between `api` and `web` (e.g. `UserDto`, `RoleDto`, user-list params). Exports are hand-picked in `packages/types/src/index.ts`; add new shared types there.
- `packages/ui` (`@repo/ui`) — leftover `create-turbo` scaffold (empty `src/`, references `@repo/eslint-config`/`@repo/typescript-config` which don't exist in this repo). Not imported by `apps/web`; the actual component library lives in `apps/web/src/components` (shadcn/ui, configured via `apps/web/components.json`).

Root `package.json` declares workspaces (`apps/*`, `packages/*`) but there is no `turbo.json`/root tsconfig — orchestration is plain npm workspace scripts, not Turborepo pipelines, despite `turbo` being a devDependency.

## Commands

Run from the repo root unless noted:

```bash
npm run dev          # runs apps/web and apps/api concurrently
npm run dev:web       # apps/web only (Next.js, http://localhost:3000)
npm run dev:api       # apps/api only (nodemon+ts-node, http://localhost:4000)
npm run build         # build --workspaces (builds every workspace)
npm run build:web
npm run build:api     # prisma generate && tsc
```

### apps/api

```bash
cd apps/api
npm run dev                 # nodemon --exec ts-node index.ts
npm run build                # prisma generate && tsc -> dist/
npm start                    # node dist/index.js
npx prisma migrate dev       # create/apply a migration (prisma/schema.prisma)
npx prisma generate          # regenerate Prisma client (also runs on postinstall)
```

There is no test runner configured in `apps/api` or `apps/web` — do not assume `npm test` exists.

Swagger UI is served at `/api` (JSON at `/swagger.json`), defined in `src/config/swagger.ts` and wired up directly in `index.ts` (not the `swagger-ui-express` static middleware, to avoid serverless asset path issues on Vercel).

### apps/web

```bash
cd apps/web
npm run dev     # next dev
npm run build   # next build
npm run lint    # next lint (eslint config: .eslintrc.json)
```

## Architecture: apps/api

Layered, DI-driven design: **routes -> controllers -> `IUnitOfService` -> services -> `IUnitOfWork` -> repositories -> Prisma**.

- **DI container**: `src/config/ioc.config.ts` binds every controller/service/repository interface to its implementation via InversifyJS. `src/config/ioc.types.ts` holds the `Symbol.for(...)` keys. Controllers/services pull dependencies via constructor default params, e.g. `constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService))` — not decorator-based `@inject`.
- **Unit of Work / Unit of Service**: `src/repository/unitofwork.repository.ts` aggregates all repositories behind one object (`unitOfWork.Product`, `unitOfWork.Order`, ...) and exposes `.transaction()` for `prisma.$transaction`. `src/services/unitOfService.ts` does the analogous aggregation for services, and controllers only ever depend on `IUnitOfService`.
- **Adding a new entity/feature** touches all of these in lockstep: `repository/interfaces/i*.repository.ts` + `repository/*.repository.ts`, `services/interfaces/I*.service.ts` + `services/*.service.ts`, `controllers/*.controller.ts`, a `routes/*Routes.ts` mounted in `src/routes/index.routes.ts`, plus new symbols in `ioc.types.ts` and bindings in `ioc.config.ts`, and usually additions to `UnitOfWork`/`UnitOfService`.
- **Request pipeline / middleware order** (see `index.ts`): CORS -> `express.json()` -> Swagger routes (public, mounted _before_ the client-id check) -> `clientid.middleware.ts` (global gate, requires a `clientId` header matching `CLIENT_ID` env unless `SITE_MODE=local`) -> `routes` -> `errorHandler.middleware.ts`. Per-route middleware order is `authenticateToken` (JWT, `authentication.middleware.ts`) -> `authorization([roles])` (RBAC, `authorization.middleware.ts`, looks up the user via `IUnitOfService.User`) -> `storeRequiredMiddleware` (`store-required.middleware.ts`, requires `req.user.storeCode`). Getting this order wrong breaks `req.user` population.
- **Multi-tenancy key is `storeCode` (a string), not `storeId`.** The Prisma schema (`prisma/schema.prisma`) relates every business model (`product`, `category`, `order`, `payment`, `staff`, ...) to `store` via `storeCode -> store.code`. `apps/api/STORE_MANAGEMENT_GUIDE.md` describes an older/aspirational `storeId`-based design — treat it as background reading only, not as a description of the current schema; trust `schema.prisma` and the actual controllers (which read `req.user.storeCode`).
- **Auth model**: JWT access + refresh tokens (`auth.controller.ts`/`authRoutes.ts`), `req.user` is populated from the decoded JWT (`userId`, `name`, `email`, `role`, `storeCode`) — it is not re-fetched from the DB except inside `authorization.middleware.ts`.
- **Response shape**: controllers return `CustomResponse<T>`-shaped JSON (`{ success, message, data }`), list endpoints use `ListResponseDto<T>` (`{ totalRecord, data }`). Follow this shape for new endpoints instead of returning raw Prisma results.
- **Errors**: custom exception classes in `src/exceptions/` (`NotFoundError`, `ForbiddenError`, `UnauthorizedError`, `CustomError`) are caught by `errorHandler.middleware.ts`.

## Architecture: apps/web

- Next.js **App Router** under `src/app`, using route groups: `(auth)` for `/login`, `/sign-up`, `/recover-password` (own layout, no shell chrome); `(pages)` for standalone public pages; `admin/*` for the authenticated back-office (products, categories, attributes, brand-names, orders, purchases, staff, staff-salaries, stores, users, settings, media, receive-stock).
- **Auth**: NextAuth (`src/app/api/auth/[...nextauth]/options.ts`) with a Credentials provider that calls the API's `/auth/login`. JWT session strategy: the `jwt` callback stores the API's access/refresh tokens and their decoded expiry, and silently calls `/auth/refreshToken` when the access token has expired; the `session` callback exposes the decoded token as `session.user`. Route protection is handled separately in `src/middleware.ts` via `withAuth`, which maps URL prefixes to allowed `Roles` (e.g. `/admin/` -> `Roles.ADMIN`) and redirects to `/access-denied` on mismatch.
- **Frontend mirrors the backend's DI/UoW pattern**: `src/config/ioc.ts` + `src/config/types.ts` bind `I*Service` interfaces (in `src/services/interfaces`) to implementations (`src/services/*.ts`) via InversifyJS; `src/services/UnitOfService.ts` aggregates them, exposed through `IUnitOfService`. Components/hooks should go through `unitOfService.<Thing>Service` rather than calling `axios`/`HttpService` directly.
- **`HttpService.ts`** wraps axios: attaches the `clientId` header (must match the API's `CLIENT_ID`) and a bearer token from `localStorage['at']`, auto-refreshes the token via NextAuth's `getSession()` on a 401 (retrying the original request once), force-logs-out on refresh failure, and redirects to `/access-denied` on 403. New API calls should be added as methods on the relevant `*Service.ts` rather than raw axios calls in components.
- **State**: Redux Toolkit store in `src/lib/store.ts`, typed hooks `useAppDispatch`/`useAppSelector` (`src/lib/hooks.ts`) — ESLint (`.eslintrc.json`) enforces using these typed hooks instead of raw `useSelector`/`useDispatch` from `react-redux`. Server-state/caching goes through React Query (`ReactQueryProvider.tsx`).
- **UI components**: shadcn/ui + Radix primitives configured via `components.json` (aliases `@/components`, base color `slate`), organized under `src/components/{ui,common,admin,layout,Header,Table,features,...}` — not `packages/ui`.
- Environment-driven config is centralized in `src/config/index.ts` (`NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_API_CLIENT_ID`, `NEXT_PUBLIC_CDN_BASE_URL`, etc.) — read config from there instead of `process.env` directly in components/services.

## Cross-cutting notes

- Both `apps/web` and `apps/api` use the same Prettier style (`semi: true`, `singleQuote: true`, `printWidth: 150`, 2-space indent) — see each app's `.prettierrc`/`.prettierrc.json`.
- The API requires a `clientId` request header (checked against `CLIENT_ID` env var) on every non-Swagger route; when calling the API from scripts/tools during local dev, set `SITE_MODE=local` to bypass this, or include the header.
- Prisma schema is a single file (`apps/api/prisma/schema.prisma`); migrations live in `apps/api/prisma/migrations`. Run `npx prisma migrate dev` from `apps/api` after schema changes, and re-run `npx prisma generate` (or rebuild) so `@prisma/client` types stay in sync.
