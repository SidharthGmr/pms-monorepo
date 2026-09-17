---
name: pms-crud-api
description: Build a new CRUD REST API endpoint set for this monorepo — shared types (dto/params/enum/model/validator) in packages/types, and the layered routes → controller → UnitOfService → service → UnitOfWork → repository → Prisma stack in apps/api (Node.js + TypeScript + Express 5 + Prisma + InversifyJS). Use whenever the user wants to "create an API", "add CRUD endpoints", "add a new module/entity/resource" (e.g. coupons, warehouses, taxes), "scaffold list/get/create/update/delete", wire a controller/service/repository, add a DTO/model/validator to @pms/types, or extend an existing entity with new endpoints. Also use when reviewing whether an API addition follows the project structure.
metadata:
  version: "1.6.0"
  tags: "api, crud, express, typescript, prisma, inversify"
---

# PMS CRUD API Builder

How to add a REST resource so it matches every other resource in the codebase. An entity
spans two workspaces: its **shared types live in `packages/types`** (dto, params, enum,
model, validator) and its **runtime layers live in `apps/api`** (repository, service,
controller, routes). Adding one is **16 files** — 10 new, 6 edited. Skip a wiring edit and
the container throws at boot (`No matching bindings found`), which is the single most
common failure mode.

## Layer contract

```
routes/xRoutes.ts          Express router: URL, middleware order, Swagger JSDoc, validate(schema)
  → controllers/x.controller.ts   HTTP only: parse req.query/params, build FilterParams, shape CustomResponse
    → IUnitOfService.X            controllers NEVER import a service class directly
      → services/x.service.ts     business rules, existence checks, throw NotFoundError; every write is transactionClient.x.create/update inside unitOfWork.transaction()
        → IUnitOfWork.X           reads only; services NEVER import prisma directly
          → repository/x.repository.ts   reads + soft delete; the only place `prisma.x.*` is called; maps rows → DTO
```

Every layer above imports its `XDto`, `XFilterParams`, `XModel`, `Status` and Zod validators
from `@pms/types` — the package is the only home for them.

Hard rules that fall out of this:

- **Dtos, params, enums, models and validators live only in `packages/types`**, each in its
  folder (`src/dto`, `src/params`, `src/enum`, `src/model`, `src/validator`), and each is added
  to `packages/types/src/index.ts` in the same commit that creates it — an unexported file is
  invisible to both apps. Never add a local copy under `apps/api/src/{dtos,params,enum,models,
  schemas}`; those folders are a pre-migration leftover, not a pattern to follow.
- A controller that touches `prisma` or `unitOfWork` is wrong.
- A service that imports `config/prisma` is wrong — use `this.unitOfWork.transaction(async (transactionClient) => …)`
  for writes and `this.unitOfWork.X.*` for reads.
- **Create and update always go through the transaction client, never a repository method.**
  Write both as:

  ```ts
  async create(data: XModel, storeCode: string): Promise<XDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      return transactionClient.x.create({ data: { storeCode, ...} });
    });
  }

  async update(id: number, data: XModel): Promise<XDto> {
    const existing = await this.unitOfWork.X.findById(id);
    if (!existing) throw new NotFoundError('X not found');
    return this.unitOfWork.transaction(async (transactionClient) => {
      return transactionClient.x.update({ where: { id }, data: { ..., updatedAt: new Date() } });
    });
  }
  ```

  `attribute.service.ts` is the canonical example. Name the callback parameter
  `transactionClient`, not `tx` — 35 of the 43 transaction callbacks in `apps/api/src/services`
  already do, so a write stays greppable; `cart.service.ts` and `product-variant.service.ts` are
  the two stragglers, not the pattern.

  **Name the const holding the write result after the entity being written**, suffixed `Data`:
  `attributeData` in `attribute.service.ts`, `brandNameData` in `brand-name.service.ts`,
  `productData` in `product.service.ts`. `storeData` is correct in exactly one file,
  `store.service.ts`.

  This is the rule copy-paste breaks first, and the one nothing catches: the const keeps the
  name of the service the block was lifted from, the inferred type still matches, `tsc` is
  happy, and the wrong name ships. `brand-name`, `product` and `attribute` all carried a
  mismatched const until 2026-09-09 (`storeData` / `categoryData`) — verify the name against
  the `transactionClient.<model>` on the same line, every time.

  `<entity>Data` is the standard for new code, and it is currently the minority — 8 of the 25
  write sites in `apps/api/src/services` (verified 2026-09-09): `attribute`, `brand-name`,
  `product`, `store`. The other 11 files bind the row to a bare noun instead — `user` /
  `updatedUser` (`account.service.ts`), `created` (`master-attribute`, `master-entry`),
  `order`, `orderItem`, `variant`, `purchase`, `review`, `reply`, `supplier`, `entry`. Those
  are legacy: do not copy them into a new resource, and do not mass-rename them either — a
  rename touching 11 services to change local const names is churn with no reader benefit.
  Rename one only when you are already editing that service for another reason.

  A const that holds a *check* rather than the written row keeps its predicate name —
  `nameExists`, `codeExists`, `existing` — not `<entity>Data`.

  The same applies outside the callback: a local const, the controller's variable, and the
  response `message` string all name the resource they belong to. Check them together, because
  they get copied together — `attribute.controller.ts` returned `'Category created
  successfully'` from a `create` whose result it had bound to `category`.

  The repository interface gets **no** `create` / `update`: that client is scoped to its
  transaction and can't be handed to a repository method that closes over the module-level
  `prisma`, so a repository write runs outside the transaction and won't roll back when a later
  step in the same operation fails. This is why an entity with a price/stock ledger
  (`product-variant`) writes the row *and* its history rows on one client. `update` still reads
  through the repository first (`findById`) to raise `NotFoundError` before opening the
  transaction — a read is not a write.
- **One model *and one validator* serve create and update.** `XModel` (in
  `packages/types/src/model/`) is the write payload for both and `xValidator` validates both —
  `POST` and `PUT` pass the same `validate(xValidator)`. `XDto` is the read shape the repository
  returns. Do not scaffold an `updateXValidator` or `UpdateXModel` by reflex; a second pair is
  two places to add a field and they drift. Split only when update genuinely accepts a
  different set of fields, and then derive rather than retype:
  `interface UpdateXModel extends Omit<XModel, 'createdById'> { updatedById: string }`.
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
3. **Write the shared types first** in `packages/types/src/{dto,params,model,validator}`, export
   each from `packages/types/src/index.ts`, then run `npm run build:types` from the root. The
   package compiles to CommonJS in `dist/` and both apps resolve `@pms/types` there, so until it
   is rebuilt `apps/api` still sees the old surface. Types in this package must not import
   `@prisma/client` — use the `Status` string union from `../enum/status.enum` and `unknown`
   for Prisma `Json` columns, or `apps/web` picks up a server-only dependency.
4. **Create the six `apps/api` files** — templates in `reference/layer-templates.md`. Within each
   file put the members in endpoint order (`create`, `getAll`, `getById`, `update`, `delete`,
   then the rest). Copy the closest existing entity rather than writing from scratch:
   `attribute` is the cleanest slice that already follows the `packages/types` split, `category`
   is the same split with soft deletes and sorting, and `product` is the reference for nested
   relations and multi-table transactions. Older resources still keep their types under
   `apps/api/src/{dtos,params,models,schemas}` — don't copy that half.
5. **Apply the 5 wiring edits** — exact insertion points in `reference/wiring.md`.
   All five, or the boot fails.
6. **Verify**: `npm run build:types`, then `npm run typecheck` from the root — both apps, since a
   change to `packages/types` reaches `apps/web` too. There is no test runner in this repo, so
   do not invent `npm test`. Then `npm run dev` and hit the routes. Swagger UI at
   `http://localhost:4000/api` renders the JSDoc you wrote — use it as the smoke test.

## Naming (copy this table, it is not guessable)

For an entity `PriceHistory` / kebab `price-history`:

| File | Path | Note |
|---|---|---|
| DTO | `packages/types/src/dto/price-history.dto.ts` | exports `PriceHistoryDto` |
| Filter params | `packages/types/src/params/price-history.params.ts` | `PriceHistoryFilterParams extends PageFilterParams` |
| Model | `packages/types/src/model/price-history.model.ts` | `PriceHistoryModel` — the create/update payload |
| Zod validator | `packages/types/src/validator/price-history.validator.ts` | one `priceHistoryValidator` for create **and** update |
| Barrel | `packages/types/src/index.ts` | add every file above under its `// dtos` / `// models` / `//Validators` heading |
| Repo interface | `apps/api/src/repository/interfaces/iprice-history.repository.ts` | **lowercase `i`** prefix |
| Repo impl | `apps/api/src/repository/price-history.repository.ts` | `class PriceHistoryRepository` |
| Service interface | `apps/api/src/services/interfaces/Iprice-history.service.ts` | **capital `I`** prefix |
| Service impl | `apps/api/src/services/price-history.service.ts` | `@injectable()` + `@inject(TYPES.IUnitOfWork)` |
| Controller | `apps/api/src/controllers/price-history.controller.ts` | plain class, `container.get` in default param |
| Routes | `apps/api/src/routes/priceHistoryRoutes.ts` | **camelCase** file, mounted at `/price-histories` (plural kebab) |

IoC symbols in `apps/api/src/config/ioc.types.ts` are `IXService` / `IXRepository` / `XController`
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
  The two guards that go with it are shared, not retyped:
  `import { MISSING_STORE_CODE, MISSING_USER_ID } from '../constants/responses'` and
  `return res.status(400).json(MISSING_STORE_CODE)` / `res.status(401).json(MISSING_USER_ID)`.
  Never inline the message or declare a local copy of either const - the web client matches on
  the wording, and 29 hand-written copies had already accumulated before they were centralised.
- **Delete is soft**: set `status: StatusEnum.Trash` + `updatedAt`, never `prisma.x.delete()`.
  List queries exclude Trash by default (`NOT: { status: StatusEnum.Trash }`). `StatusEnum`
  comes from `@pms/types`; Prisma's own `Status` is only for typing `Prisma.xWhereInput`.
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
- **Swagger JSDoc carries no filler descriptions.** An entry under `parameters:` gets
  `in` / `name` / `schema` / `required` and nothing else — no `description:`. Same for the
  properties inside a `requestBody:` schema, where `type` / `enum` / `example` already say
  it. Descriptions stay only where they carry information the reader cannot infer: the
  `tags:` block, each `responses:` status, and the operation-level `description:` when a
  route has a caveat worth stating (e.g. "storeCode is taken from the authenticated user's
  token").
- **The `requestBody:` schema is `XModel`, transcribed.** Read the model in
  `packages/types/src/model/x.model.ts` and write one property per field, in the same order,
  with the type its TypeScript type maps to — never a guess at what the endpoint "should" take.
  A non-optional field goes in `required: [...]`; an optional one (`field?:`) is simply left out
  of that list. `POST` and `PUT` share the model, so they share the block.

  | Model field | Swagger |
  |---|---|
  | `name: string` | `type: string`, listed in `required` |
  | `unit?: string` | `type: string` |
  | `displayOrder?: number` | `type: integer` (`number` for a decimal like a price) |
  | `status?: Status` | `type: string` + `enum: [Published, Draft, Trash]` |
  | `isActive?: boolean` | `type: boolean` |
  | `images?: string[]` | `type: array` + `items: { type: string }` |
  | `startsAt?: Date` | `type: string` + `format: date-time` |
  | `metadata?: unknown` | `type: object` |

  `storeCode` is never in the block — it comes from the JWT — and neither is `id`, which is a
  path parameter. If the model and the block disagree, the model is right.
- **`responses:` lists only codes the code can actually return.** Derive the set by reading the
  three layers, never by habit: every `res.status(n)` in the controller, every error the service
  throws (`NotFoundError` → 404, `ClientError` → 400, `ForbiddenError` → 403, `UnauthorizedError`
  → 401), and any Prisma error the repository can raise that `errorHandler.middleware.ts` remaps
  (`P2002` → 400, `P2025` → 404). A code no layer produces is a lie in the docs — do not paste a
  boilerplate `401` / `409` / `500` block into a route that cannot emit it. Two traps: a `409` is
  wrong for a duplicate here because `P2002` becomes a **400** `ClientError`; and the success code
  is whatever the controller literally passes to `res.status(...)`, so a `delete` that returns 201
  or 204 must be documented as that, not as 200.
- **Members go in endpoint order, everywhere: `create` → `getAll` → `getById` → `update` →
  `delete`, then anything extra.** The routes file, the controller, the service, the service
  interface and the repository (which has no `create`/`update`, so it reads `findAll` → `findById`
  → `delete`) all list the resource in that same sequence, so a reader scrolling any two files
  side by side sees the same order. Extra endpoints — bulk actions, status toggles, exports — go
  after `delete` in the order you added them, never interleaved with the five. Reordering routes
  is safe here because `/` and `/:id` cannot shadow each other; if you ever add a literal path
  that a `/:id` route could swallow (`/export`, `/bulk`), that one must still be registered
  before `/:id` — matching order wins over this convention.
- **`CustomResponse` is a default export.** `export * from './dto/custom-response'` does not
  re-export a default, which is why `index.ts` also carries
  `export type { default as CustomResponse }`. Import it as a named export from `@pms/types`
  like everything else — never reach into `@pms/types/src/...`, which bypasses `dist/` and only
  survives because the import is type-only.
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

## Where the repo actually stands

`packages/types` is the only home for dtos, params, enums, models and validators — including
API-only ones. There is no "web needs it too" test any more.

The migration there is partial, so expect three shapes in the tree (verified 2026-09-08):

| State | Resources |
|---|---|
| Fully in `packages/types` — copy these | `attribute`, `category`, `purchase`, `profile` |
| Split, so both halves exist | `product` (params still local), `product-variant` (dto + params still local), `brand-name` (only the validator moved; its `model` exists in **both** places) |
| Not started | every other resource — ~80 files under `apps/api/src/{dtos,params,models,schemas}` |

`apps/api/src/enum/user.enum.ts` is also still imported by `auth.controller.ts`,
`product.controller.ts` and `authRoutes.ts`. Read a split or unmigrated resource for its layer
structure, never for where its types live — and when two copies of a type exist, the
`packages/types` one wins. New work goes in `packages/types`; move an old resource's types
across when you are already editing it.

## Reference

- `reference/layer-templates.md` — full copy-paste template for every file, `packages/types`
  first (sections 1–3b) then `apps/api` (4–9).
- `reference/wiring.md` — the 5 registration edits, with the exact lines to add.
