---
name: pms-crud-api
description: Build a new CRUD REST API endpoint set in apps/api (Node.js + TypeScript + Express 5 + Prisma + InversifyJS) following this repo's layered routes → controller → UnitOfService → service → UnitOfWork → repository → Prisma structure. Use whenever the user wants to "create an API", "add CRUD endpoints", "add a new module/entity/resource" (e.g. coupons, warehouses, taxes), "scaffold list/get/create/update/delete", wire a controller/service/repository, or extend an existing entity with new endpoints in apps/api. Also use when reviewing whether an API addition follows the project structure.
metadata:
  version: "1.2.0"
  tags: "api, crud, express, typescript, prisma, inversify"
---

# PMS CRUD API Builder

How to add a REST resource to `apps/api` so it matches every other resource in the
codebase. Adding an entity is **13 files** — 8 new, 5 edited. Skip a wiring edit and
the container throws at boot (`No matching bindings found`), which is the single most
common failure mode.

## Layer contract

```
routes/xRoutes.ts          Express router: URL, middleware order, Swagger JSDoc, validate(schema)
  → controllers/x.controller.ts   HTTP only: parse req.query/params, build FilterParams, shape CustomResponse
    → IUnitOfService.X            controllers NEVER import a service class directly
      → services/x.service.ts     business rules, existence checks, throw NotFoundError; every write is tx.x.create/update inside unitOfWork.transaction()
        → IUnitOfWork.X           reads only; services NEVER import prisma directly
          → repository/x.repository.ts   reads + soft delete; the only place `prisma.x.*` is called; maps rows → DTO
```

Hard rules that fall out of this:

- A controller that touches `prisma` or `unitOfWork` is wrong.
- A service that imports `config/prisma` is wrong — use `this.unitOfWork.transaction(tx => …)`
  for writes and `this.unitOfWork.X.*` for reads.
- **Create and update use the transaction client, never a repository method.** Write them as
  `this.unitOfWork.transaction(async (tx) => tx.x.create({ data: { … } }))` and
  `… tx.x.update({ where: { id }, data: { … } })`. The repository interface gets **no**
  `create` / `update`: a `tx` client is scoped to its transaction and can't be handed to a
  repository method that closes over the module-level `prisma`, so a repository write runs
  outside the transaction and won't roll back when a later step in the same operation fails.
  This is why an entity with a price/stock ledger (`product-variant`) writes the row *and*
  its history rows on the same `tx`.
- **One model serves create and update.** `CreateXDto` is the payload for both — one type,
  one validator shape, one place to add a field. Don't mirror it into an `UpdateXDto` that
  drifts a field at a time. Add a separate update model only when update genuinely accepts a
  different set of fields, and then derive it rather than retyping it:
  `interface UpdateXDto extends Omit<CreateXDto, 'createdById'> { updatedById: string }`.
- A repository that throws HTTP-shaped errors is wrong — it returns `null`, the service
  turns that into `NotFoundError`.
- Nothing returns a raw Prisma row to the client: reads return `Dto` / `ListResponseDto<Dto>`.

## Workflow

1. **Confirm the Prisma model exists.** Read `prisma/schema.prisma`. Every business model
   relates to `store` via `storeCode` (a String → `store.code`) — **not** `storeId`. If the
   model is missing, add it, then from `apps/api`: `npx prisma migrate dev` and
   `npx prisma generate` before writing TypeScript, or `Prisma.xWhereInput` types won't exist.
2. **Pick the names once** (see table below) and use them everywhere — the file-name casing
   is inconsistent per folder in this repo, and guessing costs a broken import.
3. **Create the 8 new files** — templates in `reference/layer-templates.md`. Copy the
   closest existing entity rather than writing from scratch: `brand-name` is the cleanest
   simple CRUD slice (dto/params/schema/repo/service/controller/routes), `product` is the
   reference for nested relations and multi-table transactions.
4. **Apply the 5 wiring edits** — exact insertion points in `reference/wiring.md`.
   All five, or the boot fails.
5. **Verify**: `cd apps/api && npx tsc --noEmit` (there is no test runner in this repo —
   do not invent `npm test`), then `npm run dev` and hit the routes. Swagger UI at
   `http://localhost:4000/api` renders the JSDoc you wrote — use it as the smoke test.

## Naming (copy this table, it is not guessable)

For an entity `PriceHistory` / kebab `price-history`:

| File | Path | Note |
|---|---|---|
| DTO | `src/dtos/price-history.dto.ts` | exports `PriceHistoryDto`, `CreatePriceHistoryDto` |
| Filter params | `src/params/price-history.params.ts` | `PriceHistoryFilterParams extends PageFilterParams` |
| Zod schema | `src/schemas/priceHistorySchema.ts` | **camelCase** file, `createXSchema` / `updateXSchema` |
| Repo interface | `src/repository/interfaces/iprice-history.repository.ts` | **lowercase `i`** prefix |
| Repo impl | `src/repository/price-history.repository.ts` | `class PriceHistoryRepository` |
| Service interface | `src/services/interfaces/Iprice-history.service.ts` | **capital `I`** prefix |
| Service impl | `src/services/price-history.service.ts` | `@injectable()` + `@inject(TYPES.IUnitOfWork)` |
| Controller | `src/controllers/price-history.controller.ts` | plain class, `container.get` in default param |
| Routes | `src/routes/priceHistoryRoutes.ts` | **camelCase** file, mounted at `/price-histories` (plural kebab) |

IoC symbols in `config/ioc.types.ts` are `IXService` / `IXRepository` / `XController`
keys whose `Symbol.for("…")` string drops the leading `I`
(e.g. `IBrandNameService: Symbol.for("BrandNameService")`).

## Conventions that are easy to get wrong

- **Response shape is fixed.** Success: `{ success: true, message: '…', data }`
  (`CustomResponse<T>`). Lists: `data` is `{ totalRecord, data: T[] }` (`ListResponseDto<T>`).
- **Every route handler is wrapped**: `asyncHandler(controller.method)`. Express 5 does
  forward async rejections on its own, but every route in this repo wraps explicitly —
  match it so the path to `errorHandler.middleware.ts` is uniform and doesn't depend on
  Express version behaviour.
- **Middleware order is load-bearing**: `authenticateToken` → `authorization([Role.X])` →
  `storeRequiredMiddleware` → `validate(schema)` → `asyncHandler(handler)`. `req.user`
  (`userId`, `name`, `email`, `role`, `storeCode`) only exists after `authenticateToken`.
- **Controller methods are arrow-function properties**, not methods — they're passed by
  reference to the router, so `this` must be lexically bound.
- **`storeCode` comes from `req.user`, never from the request body.** Read it in the
  controller and pass it to the service; put it into `FilterParams` for list endpoints so
  tenants can't read each other's rows.
- **Delete is soft**: set `status: Status.Trash` + `updatedAt`, never `prisma.x.delete()`.
  List queries exclude Trash by default (`NOT: { status: Status.Trash }`).
- **Client-driven sorting must be allow-listed** against a `SORTABLE_COLUMNS` set — an
  arbitrary `sortBy` string reaching Prisma's `orderBy` is a runtime error. Nullable columns
  need `nulls: 'last'` plus an `{ id: 'desc' }` tiebreaker.
- **Pagination**: `page`/`recordPerPage` from `PageFilterParams`; `showAllRecords === true`
  means leave `skip`/`take` undefined rather than passing a huge `take`.
- **Duplicates are already handled**: Prisma `P2002` is converted to a 400 `ClientError`
  with a humanized message in `errorHandler.middleware.ts` — don't pre-check for uniqueness
  or catch it in the service.
- **Zod schemas wrap the request**: `z.object({ body: z.object({ … }) })`, because
  `validate` parses `{ body, query, params }` together.
- **Client-id gate**: every non-Swagger route requires a `clientId` header matching
  `CLIENT_ID`; set `SITE_MODE=local` when calling from scripts/curl during dev.
- Prettier here: `singleQuote: true`, `semi: true`, `printWidth: 150`, 2-space indent.

## Comments

**Write no comments.** The layers are uniform, so a reader who knows one resource knows them
all — a comment restating what the next line does is noise to scroll past, and it goes stale
the moment the line changes.

Comment only where the logic is genuinely complex, meaning a reader who understands the code
would still make a wrong change without it:

- a non-obvious invariant (a write that must stay inside a specific transaction, an ordering
  two call sites depend on),
- a workaround whose reason is invisible (a library quirk, a Prisma/PgBouncer constraint),
- a raw SQL query or a window function.

Not comment-worthy: what a function is called, what a DTO field maps to, "// create the user",
section banners (`// 1. validate`), restating a conditional, or JSDoc that repeats the
signature. Delete commented-out code rather than leaving it — git has it.

## Shared types

Only add to `packages/types` (`@pms/types`) when `apps/web` needs the same DTO/params —
exports are hand-picked in `packages/types/src/index.ts`. API-only types stay in `apps/api/src`.

## Reference

- `reference/layer-templates.md` — full copy-paste template for each of the 8 files.
- `reference/wiring.md` — the 5 registration edits, with the exact lines to add.
