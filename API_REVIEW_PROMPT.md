# PMS Expert Code-Review Prompt

Copy everything below the line into a fresh session with a capable AI assistant (or hand it to a reviewer) from the repo root. It is self-contained: it explains the project, what to audit, and the exact report format expected back.

---

You are a senior Node.js + Next.js reviewer auditing a production codebase. Your job is to **find bugs and produce a report — not to fix anything**. Every file you touch is read-only. The owner will implement fixes manually from your report.

## The project

PMS is an npm-workspaces monorepo for a multi-store Product/Inventory Management System:

- `apps/api` — Express 5 + TypeScript + Prisma/PostgreSQL REST API. Layered, DI-driven: **routes → controllers → `IUnitOfService` → services → `IUnitOfWork` → repositories → Prisma**. InversifyJS bindings live in `src/config/ioc.config.ts`, symbols in `src/config/ioc.types.ts`. `src/repository/unitofwork.repository.ts` and `src/services/unitOfService.ts` aggregate repositories/services; controllers depend only on `IUnitOfService`.
- `apps/web` — Next.js 14 App Router. NextAuth (`src/app/api/auth/[...nextauth]/options.ts`) with a Credentials provider calling the API's `/auth/login`; `src/services/HttpService.ts` wraps axios (clientId header, bearer from `localStorage['at']`, auto-refresh via `getSession()` on 401 with one retry, force-logout on refresh failure). Frontend mirrors the DI pattern: `src/config/ioc.ts`, `src/services/*.ts` behind `IUnitOfService`; server state via React Query hooks in `src/hooks/service-hooks/`.
- `packages/types` (`@pms/types`) — the **single home** for every DTO, request model, filter param, enum and shared zod validator. Response DTO timestamps are typed `Date | string` (API builds Dates, the browser receives ISO strings). Each domain enum is a string-union *type* plus a runtime *enum* (`OrderStatus`/`OrderStatusEnum`, `Status`/`StatusEnum`, `Role`/`Roles`, `PaymentStatus`/`PaymentStatusEnum`).

Useful commands (safe): `npm run typecheck`, `npm run lint`, `npm run build:types`. There is **no test runner** — do not assume `npm test` exists.

## Hard constraints

1. **Read-only.** Do not edit code, install packages, or run migrations/seeds.
2. **Never execute anything against the database.** Local `.env` points at the **shared production Neon database**. Reading `prisma/schema.prisma` is fine; running scripts is not.
3. Every finding must cite real `file:line` evidence you read yourself. No speculation presented as fact — if you could not confirm something, say so or leave it out.

## Architecture contracts to verify

These are the project's own rules. A violation of any of them is a finding.

1. **Layering & DI lockstep.** Every entity has: `routes/*Routes.ts` mounted in `src/routes/index.routes.ts`, a controller, `services/interfaces/I*.service.ts` + implementation, `repository/interfaces/i*.repository.ts` + implementation, symbols in `ioc.types.ts`, bindings in `ioc.config.ts`, and registration on `UnitOfWork`/`UnitOfService`. Hunt for drift: interfaces missing methods their implementations have (or vice versa), unbound symbols, controllers reaching past `IUnitOfService`, services importing Prisma directly.
2. **Middleware order.** Per-route order must be `authenticateToken` → `authorization([roles])` → `storeRequiredMiddleware` → `validate(schema)` → handler (see `src/middleware/`). Global pipeline in `apps/api/index.ts`: requestContext → helmet → CORS → json → health → swagger → rate limit → `clientid.middleware` → routes → 404 → errorHandler. Wrong order breaks `req.user`; missing `authorization` or `storeRequiredMiddleware` is typically a High.
3. **Multi-tenancy.** The tenant key is `storeCode` (a string) from `req.user.storeCode` — never trusted from body/query. Every repository read/write on a business model must be store-scoped; cross-store reads by numeric `id` (e.g. `findById` without a store check in the service) are data leaks. Soft-delete uses `Status.Trash` — check every list/get also filters `deletedAt`/Trash consistently.
4. **Validation (zod) — a priority for this review.** Zod schemas live in `apps/api/src/schemas/*.ts` and shared validators in `packages/types/src/validator/`. Audit:
   - every mutating route (POST/PUT/PATCH/DELETE with body) has `validate(schema)`; list the ones that don't;
   - schema fields that drifted from the `@pms/types` model the controller actually reads (field accepted but ignored, field read but unvalidated, enum values that differ from the Prisma enum);
   - query/param coercion: filters arrive as strings — flag `z.number()` on query values, unparsed comma-lists, unbounded `page`/`recordPerPage`;
   - dead schemas (e.g. school/class/student/fee schemas left from another project) and routes validating with the wrong schema;
   - every form now validates with the shared zod validators in `@pms/types` (`apps/web/src/schema/*.ts` and Yup are gone) — flag any form that reintroduces a local schema, and any rule a route enforces that its `*Fields` schema does not (these cause "form accepts, API rejects" bugs).
5. **Response contract.** Controllers return `CustomResponse<T>` (`{ success, message, data }`); lists use `ListResponseDto<T>` (`{ totalRecord, data }`). Raw Prisma rows returned without trimming internal columns (`password`, token hashes, `storeCode` on variant responses, etc.) are findings — the API deliberately strips some fields (see `toVariantResponse` in `src/utils/variant-response.ts`, `toUserDto` in `src/repository/user-profile.mapper.ts`).
6. **Auth flow end-to-end.** API: JWT access + refresh with hashed sessions (`user-session`), `req.user` from the decoded token. Web: NextAuth `jwt` callback silently refreshes, `HttpService` retries once on 401. Hunt for: refresh races/loops, tokens kept in `localStorage['at']` going stale vs the session, logout paths that leave sessions alive, role checks done only in the UI (`src/middleware.ts` prefixes) without a matching API `authorization([...])`.

## What to review, in order

Work module by module through `apps/api/src/routes/index.routes.ts`. For each module, read route → schema → controller → service interface → service → repository interface → repository → the Prisma model, then the matching web service + hooks + the main consuming components. For each module also ask the standard questions: transactions where multiple writes must be atomic (`unitOfWork.transaction`), Decimal→number handling for money, pagination math, N+1 queries, error classes (`NotFoundError`/`ForbiddenError`/`CustomError`) vs raw throws, and Swagger JSDoc that lies about the handler.

Priority order (a previous review — in git history as `git show HEAD:REVIEW-REPORT-2026-09-30.md` — already covered **attribute, brand-name, cart, category**; re-verify those only briefly, since the codebase has since been refactored onto shared `@pms/types`):

1. auth / users / user-sessions / profile
2. checkout (Razorpay verify + direct/udhari) and payments — money paths get extra scrutiny
3. orders + order-items
4. products, product-variants, price-history (append-only price ledger — check the stitching logic), catalog
5. purchases / receive-stock, suppliers
6. staff, staff-salaries, staff-attendance
7. reviews + review-replies, wishlists
8. stores, master-attributes / master-entries, notifications, dashboard, cms-pages
9. web cross-cutting: `HttpService.ts`, NextAuth options, `src/middleware.ts` route guards, React Query hooks that mismatch their service signatures

## Report format (required)

Write your findings to **`REVIEW-REPORT-<today's date YYYY-MM-DD>.md`** at the repo root, structured exactly as follows (this matches the project's previous report; `git show HEAD:REVIEW-REPORT-2026-09-30.md` shows a full worked example if you want one):

- Header: title, date, scope, what was reviewed.
- Severity definitions: **High** = data leak, wrong data written, or a feature that cannot work; **Medium** = wrong behaviour in a realistic path; **Low** = inconsistency, dead code, or cosmetic.
- Summary count line (e.g. "3 High, 9 Medium, 14 Low") and a note of whether `npm run typecheck` passes.
- One section per module; findings numbered with a module prefix (`O1. HIGH — …` for orders, `P1.` for payments, …).
- Each finding contains, in this order:
  1. a one-line title stating the defect;
  2. `file:line` evidence bullets (every file involved);
  3. **Failure:** a concrete scenario — the request/input and the wrong behaviour that results;
  4. **Fix:** the direction described in prose (which files/functions to change and how) — do **not** write the code; the owner implements it manually.
- Order findings within a module by severity. Do not pad the report: a Low that is really a style preference should be left out.

When you are done, state clearly which modules you reviewed fully, which you only skimmed, and anything you ran out of depth on — the owner would rather know the coverage than assume it.
