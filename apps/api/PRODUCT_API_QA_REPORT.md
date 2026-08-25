# Product API — QA Report

**Date:** 2026-08-24
**Scope:** `/products` endpoint family in `apps/api`
**Files reviewed:**

- `src/routes/productRoutes.ts`
- `src/controllers/product.controller.ts`
- `src/services/product.service.ts`
- `src/repository/product.repository.ts`
- `src/params/product.params.ts`
- `packages/types/src/validator/product.validator.ts`
- `packages/types/src/model/product.model.ts`
- `prisma/schema.prisma` (`product`, `ProductVariant`, `PriceHistory`, `stockHistory`)
- supporting: `src/utils/variant-pricing.ts`, `src/repository/product-variant.repository.ts`, `src/repository/price-history.repository.ts`, `src/middleware/*`

**Method:** static review of the full request path (route → controller → service → repository → Prisma) cross-checked against the Prisma schema, plus `npx tsc --noEmit`.

**Build status:** `npx tsc --noEmit` passes with no errors. Every finding below is a runtime / logic / contract defect, not a compile error.

**Summary**

| Severity | Count | Theme |
|---|---|---|
| P0 | 1 | Authentication removed from all product routes |
| P1 | 6 | Data integrity, data loss, information disclosure |
| P2 | 8 | Access control, correctness |
| P3 | 7 | Performance, API contract, hygiene |

---

## P0 — Blocker

### BUG-01 · Authentication stripped from every product route

- **Location:** `src/routes/productRoutes.ts` (uncommitted working-tree change)
- **Detail:** `authenticateToken` was removed from **all 9 routes**: `GET /`, `GET /reports/low-stock`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`, `PATCH /:id/stock`, `GET /:id/stock-history`.
- **Impact:**
  - `GET /products/:id/stock-history` becomes **fully anonymous**. The controller's store check (`product.controller.ts:243`) is `if (req.user?.storeCode && …)`; with no auth there is no `req.user`, so the guard is skipped entirely. The response leaks every stock movement, `createdBy.name` (staff names) and variant SKUs.
  - The remaining endpoints do not become open, they become **broken**: `GET /` → 400, `POST` / `PUT` / `PATCH` → 400, `DELETE` / `GET /:id` → 403, because `req.user` no longer exists.
  - `authenticateToken` also performs server-side session validation (`middleware/authentication.middleware.ts:49-55`), so revoked sessions are no longer rejected.
- **Expected:** every product route requires a valid bearer token; Swagger already declares `security: bearerAuth` on all of them.
- **Notes:** the now-unused `authenticateToken` import compiles silently because `noUnusedLocals` is not enabled — nothing warns you.
- **Repro:** `curl -H "clientId: $CLIENT_ID" http://localhost:4000/products/1/stock-history` with no `Authorization` header → 200 with data.
- **Fix:** `git checkout -- apps/api/src/routes/productRoutes.ts` (if this was local debugging). Must not reach a shared branch.

---

## P1 — Data integrity / data loss / disclosure

### BUG-02 · `PUT /products/:id` republishes drafts and resurrects trashed products

- **Location:** `src/services/product.service.ts:143` — `status: data.status || StatusEnum.Published`
- **Impact:** any update that omits `status` forces the product to `Published`. A Draft becomes live; a Trash (soft-deleted) product returns to the catalog.
- **Expected:** omitted `status` leaves the stored value untouched. Prisma's own column default is `Draft` (`schema.prisma`), which the create path also overrides (`product.service.ts:81`).
- **Repro:** create a product with `status: "Draft"` → `PUT /products/{id}` with `{"name":"Renamed"}` → response shows `status: "Published"`.

### BUG-03 · Partial update silently wipes fields

- **Location:** `src/services/product.service.ts:138-141`; validator `packages/types/src/validator/product.validator.ts:22` (`productFields.partial()`)
- **Detail:** every field is optional at validation, but the service writes unconditional nulls: `brandNameId: data.brandNameId || null`, `attributeId: … || null`, `description: … || null`.
- **Impact:** a targeted update erases unrelated data. `||` also nulls a legitimate `0`.
- **Expected:** absent keys are not written (`...(x !== undefined && { x })`), and `??` instead of `||` where falsy-but-valid values exist.
- **Repro:** product with brand, attribute and description → `PUT /products/{id}` with `{"name":"X"}` → all three are `null`.

### BUG-04 · `costPrice` destroyed on every price write

- **Location:** `src/services/product.service.ts:163` (`update`) and `:279` (`addStock`)
- **Detail:** `const newCost = data.costPrice ?? null` — sending `sellingPrice` without `costPrice` appends a ledger row with `costPrice: null`. The previous value is never carried forward.
- **Impact:** margin data is silently lost from that point forward; all downstream margin/profit reporting reads `null`.
- **Expected:** absent `costPrice` inherits the current effective cost, or the price write is rejected as incomplete.
- **Repro:** product priced at selling 100 / cost 60 → `PUT` with `{"sellingPrice":120}` → new `PriceHistory` row has `costPrice = null`.

### BUG-05 · "Only when the price moved" guard never fires — duplicate ledger rows

- **Location:** `src/services/product.service.ts:182`

```ts
const costChanged = Number(defaultVariant.costPrice ?? NaN) !== Number(newCost ?? NaN);
```

- **Detail:** `NaN !== NaN` is always `true`, so whenever cost is null on both sides `costChanged` is `true`.
- **Impact:** every save that includes `sellingPrice` appends a new `PriceHistory` row and closes the previous one (`effectiveTo`), which is exactly what the comment at `:179-180` claims to prevent. The ledger fills with identical rows and the price-history UI becomes unreadable.
- **Secondary risk:** two writes in the same millisecond collide on `@@unique([storeCode, variantId, effectiveFrom])` → 400 "already exists".
- **Expected:** no ledger row when neither figure changed. Compare null-safely (e.g. treat both-null as equal).
- **Repro:** `PUT` the same unchanged payload three times → three new `PriceHistory` rows.

### BUG-06 · Public catalog leaks cost prices and crosses stores

- **Location:** `src/controllers/product.controller.ts:106` (`getAllPublic`, unauthenticated by design) → shares `findAll` with the admin list → `src/repository/product.repository.ts:133` (`variants[].costPrice`) and `:144` (`currentPrice.costPrice`)
- **Impact:** cost / margin data is served to anonymous callers. `storeCode` is also optional on that endpoint, so omitting it returns products from **every** store in one response.
- **Expected:** the public projection omits `costPrice` (and ideally requires `storeCode`).
- **Repro:** `GET /products/public` → each item carries `currentPrice.costPrice` and `variants[].costPrice`.

### BUG-07 · `status` is not enum-validated → 500 instead of 400

- **Location:** `packages/types/src/validator/product.validator.ts:18` — `status: z.string().optional()`
- **Impact:** an invalid enum value reaches Prisma and raises `PrismaClientValidationError`, which `errorHandler.middleware.ts` only special-cases for P2002 → **500**.
- **Expected:** 400 with a field-level validation message. Use `z.nativeEnum(Status)`.
- **Repro:** `POST /products {"…","status":"published"}` (lowercase) or `"Publish"` → 500.

---

## P2 — Access control & correctness

### BUG-08 · Tenant isolation is conditional — a user without `storeCode` bypasses it

- **Location:** `src/controllers/product.controller.ts:151` (getById), `:177` (update), `:199` (delete), `:243` (stock-history) — all read `if (req.user?.storeCode && …)`
- **Impact:** an authenticated ADMIN / SUPER_ADMIN whose token carries no `storeCode` can read and **delete** any store's product. `delete` and `getStockHistory` have no `!storeCode` precondition (create / getAll / update do), and `getStockHistory` has no role or ownership check at all.
- **Expected:** cross-store access is denied unconditionally; a missing `storeCode` is a 403, not a skipped check. `storeRequiredMiddleware` already exists for this (`middleware/store-required.middleware.ts`).

### BUG-09 · Per-user ownership filter in `getAll` is dead code

- **Location:** `src/controllers/product.controller.ts:33`
- **Detail:** `isAdmin` is true for `SUPER_ADMIN || ADMIN || USER || STAFF` — i.e. every role — so `createdById` is always `undefined` and the repository filter at `product.repository.ts:53` never applies.
- **Expected:** either restrict the role list so non-privileged users see only their own products, or delete the branch.

### BUG-10 · `?status=Trash` can never return rows

- **Location:** `src/repository/product.repository.ts:36` and `:55-59`
- **Detail:** `where` is seeded with `NOT: { status: Trash }`; the `status` filter sets `where.status` without clearing that `NOT`, producing the contradiction `{ status: Trash, NOT: { status: Trash } }`. The `else` branch at `:58` is also redundant.
- **Impact:** a trash-bin / restore view is impossible to build.
- **Expected:** an explicit `status` filter replaces the default exclusion.

### BUG-11 · Update silently ignores fields it accepts

- **Location:** `src/services/product.service.ts:136-150`
- **Detail:** `displayOrder`, `parentId` and `isFeatured` are never written, though create accepts `displayOrder` / `parentId` (`:77`, `:83`) and the validator allows both on update.
- **Impact:** reordering a product returns 200 and changes nothing — a silent no-op for the client.
- **Also:** `shortDescription`, `seoTitle`, `seoDescription` and `metadata` are columns no endpoint can write at all.

### BUG-12 · Soft delete is half-implemented and does not cascade

- **Location:** `src/repository/product.repository.ts` (`delete` sets only `status: Status.Trash`)
- **Detail:** `deletedAt`, `deletedById` and `updatedAt` are never set, although all three columns exist and are indexed. Product reads never filter `deletedAt`, while variant reads do (`:108`, `:215`) — the two soft-delete mechanisms disagree.
- **Impact:** variants of a trashed product stay `isActive: true` and keep appearing in `/product-variants` and the public catalog.
- **Expected:** one consistent soft-delete convention, applied to the product and its variants.

### BUG-13 · Invalid or cross-store foreign keys return 500

- **Location:** `src/services/product.service.ts:70-85` (create), `:152-155` (update)
- **Detail:** relations are composite (`category @relation(fields: [storeCode, categoryId])`). A `categoryId` that does not exist **in the caller's store** raises P2003 / P2025, and `errorHandler.middleware.ts` only maps P2002 → **500**. Same for `brandNameId`, `attributeId`, `parentId`.
- **Expected:** 400 / 404 with a message naming the bad reference; validate ownership before writing.

### BUG-14 · `PUT /products/abc` returns the wrong error

- **Location:** `src/controllers/product.controller.ts:161` — `if (!id) throw new NotFoundError("Product id is required")`
- **Detail:** `parseInt("abc")` is `NaN`, which is falsy → **404 "Product id is required"** instead of the 400 "Invalid id" every other handler returns. `id=0` takes the same path.
- **Expected:** `isNaN(id)` → 400, consistent with `getById` / `delete` / `addStock`.

### BUG-15 · `addStock` returns a stale product

- **Location:** `src/services/product.service.ts:287` — `return existing`
- **Detail:** `existing` is captured *before* the transaction, so the response's `stock` is the pre-movement value.
- **Impact:** any client rendering the response shows the old number and appears not to have saved.
- **Expected:** re-read the product (or return the new movement / computed stock) after the transaction.

---

## P3 — Performance, contract, hygiene

### BUG-16 · `findLowStock` has no database-side limit

- **Location:** `src/repository/product.repository.ts` (`findLowStock`) — `findMany` with no `take`, enrichment for every row, then `.slice()` in JS
- **Impact:** O(catalog) work per request; the report degrades linearly with the store's product count.
- **Also:** it ignores `sortBy` / `sortOrder`, which the controller does not parse either.

### BUG-17 · Product search only matches `name`

- **Location:** `src/repository/product.repository.ts:42-47` (note the stray empty element in the `OR` array where a condition was removed)
- **Impact:** searching by SKU or slug returns nothing, even though the variant list searches `sku` / `barcode` / `name` (`product-variant.repository.ts`).

### BUG-18 · List and detail return different shapes

- **Location:** `findAll` strips `categoryId` / `brandNameId` / `attributeId` / `parentId` and returns names (`product.repository.ts:150`); `findById` returns the raw ids **and** the names.
- **Impact:** clients must branch on which endpoint produced the object.

### BUG-19 · `product.stock` and the sum of `variants[].stockQuantity` disagree

- **Location:** `src/repository/product.repository.ts:157` vs `:131`
- **Detail:** `stock` is the groupBy over *all* `stockHistory` rows for the product — including rows with `variantId: null` (product-level movements from the create path, orders, purchases) and rows belonging to inactive or soft-deleted variants. `variants[].stockQuantity` counts only that variant's rows.
- **Impact:** the product total can exceed the sum of the listed variants, which reads as a bug in any UI that shows both.

### BUG-20 · Documented status codes do not match behaviour

- **Location:** `src/routes/productRoutes.ts` (Swagger blocks) vs `src/middleware/errorHandler.middleware.ts`
- **Detail:** the docs advertise **409** for a duplicate slug; `@@unique([storeCode, slug])` → P2002 → `ClientError` → **400**.

### BUG-21 · `validate()` discards the parsed body

- **Location:** `src/middleware/validate.ts`
- **Detail:** the middleware calls `schema.parse(...)` and throws the result away; handlers then use raw `req.body` with an `as ProductModel` cast, so unknown keys survive and nothing is coerced.
- **Impact:** low here only because the service picks fields explicitly — but the pattern invites mass-assignment in any handler that spreads the body.

### BUG-22 · Deep import into another workspace package

- **Location:** `src/controllers/product.controller.ts:10` — `import CustomResponse from "@pms/types/src/dto/custom-response"`
- **Detail:** bypasses the package root, which already re-exports it (`packages/types/src/index.ts`). Works today only because `main` points at `src`; it breaks the moment the package gets a build step.
- **Also:** `getStockHistory` is typed `ListResponseDto<any>` end to end (controller, service, repository).

---

## Suggested fix order

1. **BUG-01** — restore `authenticateToken` on all product routes.
2. **BUG-02, 03, 04, 05** — all four live in the same block, `product.service.ts:132-234`; one pass fixes them.
3. **BUG-06, 07** — public projection and `status` enum validation.
4. **BUG-08** — make tenant isolation unconditional (reuse `storeRequiredMiddleware`).
5. Remaining P2s, then P3s.

## Regression checklist

Run against a store with at least two products, one Draft and one Trash.

- [ ] every product route returns 401 without a bearer token
- [ ] `GET /products/:id/stock-history` returns 401 anonymously
- [ ] `PUT` with `{"name":"X"}` leaves `status`, `brandNameId`, `attributeId`, `description` unchanged
- [ ] a trashed product stays trashed after an unrelated `PUT`
- [ ] `PUT` with `{"sellingPrice":120}` keeps the existing `costPrice`
- [ ] three identical `PUT`s produce **one** `PriceHistory` row, not three
- [ ] `GET /products/public` contains no `costPrice` anywhere in the payload
- [ ] `POST /products` with `status: "publish"` → 400, not 500
- [ ] a user token without `storeCode` cannot read, update or delete another store's product
- [ ] `POST /products` with a `categoryId` from another store → 400/404, not 500
- [ ] `PUT /products/abc` → 400 "Invalid id"
- [ ] `PATCH /products/:id/stock` response reflects the new stock
- [ ] `GET /products?status=Trash` returns the trashed product
- [ ] `GET /products?search=<sku>` finds the product by SKU
- [ ] `GET /products?sortBy=<garbage>` falls back to `createdAt` without erroring
- [ ] trashing a product removes its variants from `/product-variants` and the public catalog
