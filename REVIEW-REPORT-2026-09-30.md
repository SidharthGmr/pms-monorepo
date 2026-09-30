# PMS Code Review: Attribute, Brand Name, Cart, Category (API + UI)

Date: 2026-09-30
Scope: `apps/api` (Express 5 + Prisma), `apps/web` (Next.js 14), `packages/types`
Reviewed: routes, controllers, services, repositories, Prisma models, shared validators, web services, React Query hooks, admin pages/components for the four modules.

Severity: **High** = data leak, wrong data written, or a feature that cannot work. **Medium** = wrong behaviour in a realistic path. **Low** = inconsistency, dead code, or cosmetic.

Summary count: 4 High, 12 Medium, 20 Low.

`tsc --noEmit` passes for both `apps/api` and `apps/web` (exit 0), so every item below is a runtime/logic defect, not a compile error.

---

## 1. Cart

### C1. HIGH (security) — Any signed-in user can read, edit, or clear another user's cart
- `apps/api/src/controllers/cart.controller.ts:26-30` — `ownerFrom()` resolves the owner as `userId ?? req.user.userId`, where `userId` is taken from the request **body** (`addProducts`, `updateQuantity`, `updateVariantQuantity`) or **query string** (`getActive`, `removeVariant`, `removeProduct`, `clear`).
- `packages/types/src/validator/cart.validator.ts:15,37` explicitly allow `userId` and `sessionToken` in the body.
- `apps/web/src/services/CartService.ts:21,35,45,49` still forward an optional `userId` query param.
- Failure: `GET /carts/active?userId=<victim>` or `DELETE /carts?userId=<victim>` works for any authenticated user in the same store.
- Fix: always use `req.user.userId`; delete `userId`/`sessionToken` from `AddToCartModel`, `UpdateCartItemModel`, the validators, the controller, and the web service signatures.

### C2. HIGH — Cart page edits the wrong line for multi-variant products
- `apps/api/src/services/cart.service.ts:119-138` (`updateProductQuantity`) and `:180-194` (`removeProduct`) resolve the product's **first active variant** via `ProductVariant.getActive(productId)[0]`, not the variant that is actually in the cart.
- `apps/web/src/components/features/cart/index.tsx:50-53` uses the product-keyed hooks (`useUpdateCartQuantity`, `useRemoveFromCart`) even though every line is variant-keyed (`item.variantId`), and the storefront adds by variant (`public-variants/variant-card.tsx:62`).
- Failure: a shopper adds variant B; pressing +/- or trash on that line targets variant A. If A is not in the cart, `setItemQuantity` runs `cartItem.update` → Prisma P2025 → 404 "The requested record no longer exists." If A is in the cart, A's quantity changes instead of B's.
- Fix: add `useUpdateVariantQuantity` / `useRemoveVariant` hooks in `hooks/service-hooks/useCartService.ts` (the service methods already exist), and pass `item.variantId` from the cart page. Optionally make the product-keyed API path look up the line by `productId` inside the cart rather than re-resolving the default variant.

### C3. MEDIUM — Product-keyed add does not check the store
- `apps/api/src/services/cart.service.ts:28-40` `resolveVariant()` never compares the variant's `storeCode` to the cart's store; `resolveChosenVariant()` (line 54) does.
- Failure: `POST /carts { productIds: [<id from another store>] }` puts a foreign store's variant into this store's cart.
- Fix: pass the store code and reject mismatches, same as the variant path.

### C4. MEDIUM — Soft-deleted variants can be added to a cart
- `apps/api/src/services/cart.service.ts:51` checks `isActive` only; `ProductVariant.findById` (`product-variant.repository.ts:180`) has no `deletedAt: null` filter.
- Fix: add `deletedAt: null` to the lookup or reject when `variant.deletedAt` is set.

### C5. MEDIUM — Two active carts can be created under concurrency
- `apps/api/src/repository/cart.repository.ts:75-90` `getOrCreateActive` is find-then-create; `Cart` has no unique constraint on (`storeId`, `userId`, `status = ACTIVE`) (`prisma/schema.prisma:110-127`).
- Failure: two fast "Add to cart" clicks create two ACTIVE carts; `getActive` then returns whichever was updated last, so items appear to vanish.
- Fix: partial unique index (`@@unique` cannot express it; use a raw migration `CREATE UNIQUE INDEX ... WHERE status = 'ACTIVE'`) and catch P2002 to re-read, or serialise per user.

### C6. LOW — Schema default currency is `"IND"`
- `apps/api/prisma/schema.prisma:116` defaults to `IND`; `cart.service.ts:12` uses `INR`. `IND` is not an ISO 4217 code. Any cart created outside the service shows "IND" in the UI (`components/features/cart/index.tsx:57-58`).

### C7. LOW — `x-cart-session` header is read but blocked by CORS; guest carts are unreachable
- `cart.controller.ts:27` reads `x-cart-session`; `apps/api/index.ts:69` `allowedHeaders` does not include it, so a browser preflight would fail.
- Every cart route requires `authenticateToken`, so a `sessionToken` owner can never be used. Either remove the guest path or add public routes plus the header.

### C8. LOW — `expiresAt`, `ABANDONED`, `EXPIRED` are never set or checked
- No code writes `expiresAt` or transitions status; abandoned carts live forever.

### C9. LOW — N+1 store lookups
- `cart.controller.ts:16` does a store lookup on every request; `cart.service.ts:48` calls `Store.getById` once per variant inside the add loop. Resolve once per request and pass it down.

### C10. LOW — Money totals computed in floating point
- `cart.repository.ts:35,56` multiply and sum JS numbers from a `Decimal(12,2)` column; totals like `0.1 + 0.2` will drift. Round to 2 dp or sum with `Prisma.Decimal`.

---

## 2. Brand Names

### B1. HIGH (UI) — Deleted brands stay in the admin list; pagination is fake
- `apps/web/src/components/features/brand-names/index.tsx:47` always sends `showAllRecords: true`.
- `apps/api/src/repository/brand-name.repository.ts:62-66` only excludes `Trash` when `!showAll`, so trashed rows come back (they render with an orange "Trash" badge).
- With `showAll`, the API also ignores `page`/`recordPerPage`, so the table (`manualPagination: true`) shows every row on every page and `DataTablePagination` is not given `totalRecord`.
- Fix: remove `showAllRecords: true` from the list call (keep it for dropdown consumers), or change the API so `Trash` is excluded whenever `status` is absent regardless of `showAll`.

### B2. HIGH (UI) — Add/Edit form locks after the first failed submit
- `apps/web/src/components/features/brand-names/add-edit/index.tsx:100-103` sets local `showLoader = true` and never resets it; the guard `if (showLoader) return;` then blocks every later submit.
- Failure: submit a duplicate name → API 400 → toast → fix the name → click Save → nothing happens. The button re-enables because it uses the mutation's `isPending`, so the user gets no feedback.
- Fix: delete the local `showLoader` state and the reducer `SHOW_LOADER` dispatches; rely on `isLoading` (mutation pending).

### B3. MEDIUM (API) — `status` query param is not validated → 500
- `apps/api/src/controllers/brand-name.controller.ts:38` casts any string to `Status`; Prisma throws `PrismaClientValidationError` on `?status=foo`, which the error handler reports as a 500.
- `attribute.controller.ts:29` does it right with `Object.values(StatusEnum).includes(...)`. Category has the same bug (`category.controller.ts:36`).

### B4. MEDIUM (API) — A deleted brand name can never be re-created
- Delete is a soft delete to `Trash` (`brand-name.repository.ts:95-101`), but `@@unique([name, storeCode])` (`schema.prisma:516`) still includes trashed rows → "A brand name with this name already exists."
- The UI has no way to view or restore Trash rows (`data/status.data.ts` has only Published/Draft).
- Fix: hard delete, or a restore action, or exclude trashed rows from uniqueness (rename on trash, or partial unique index).

### B5. MEDIUM (API) — Trashing a brand still used by products is not guarded
- Category checks `countProducts` before delete (`category.service.ts:93-103`); brand and attribute do not. Products keep `brandNameId` / `attributeId` pointing at a trashed row.

### B6. LOW (API) — `res.status(204).json(...)` sends no body
- `brand-name.controller.ts:81`, `attribute.controller.ts:59`. Express strips the body on 204, so the returned DTO is wasted and `Response<void>` on the web side is the honest type. Category returns 200 with a body. Pick one convention for all three.

### B7. LOW (UI) — Copy-paste text and dead code in the brand dialog
- `add-edit/index.tsx:27` `modalHeading: 'Add Grade'`; `:147` `aria-label="Loading course"`; `:166-167` "Could not load this course … go back to the course list".
- `:162` skeleton condition `isEdit && isLoading && getbrandNameResponse.isLoading` requires a mutation to be pending, so the skeleton never shows; the form appears with empty defaults until `reset`.
- `:136-143` `handleCancel` and `showLeaveConfirm` exist, but the Cancel button (`:242`) calls `onClose(false)` directly, so the unsaved-changes prompt never appears.

### B8. LOW (UI) — Sorting wiring is dead
- `columns.tsx:24` `accessorKey: 'brandName'` is not a DTO field (it is `name`), and `meta.sortingKey: 'brandName'` is not in the API's `SORTABLE_COLUMNS`. Every column has `enableSorting: false`, so the `field`/`order` effect in `index.tsx:89-97` never fires.

### B9. LOW — Storefront brand strip is hard-coded
- `components/storefront/sections/Brands.tsx` renders `BRANDS` from `theme.config`, not the brand API. Fine if intentional.

### B10. LOW (UI) — Confirm text says "cannot be undone" for a soft delete
- `index.tsx:173`.

---

## 3. Categories

### K1. HIGH (UI) — Display Order cannot be saved
- `packages/types/src/validator/category.validator.ts:20` is `z.number().int()` with no coercion.
- `apps/web/src/components/features/categories/add-edit/index.tsx:245` binds a plain text `<Input {...field}>`, so the value becomes a string as soon as the user types → "expected number, received string". Clearing the box yields `''`, which also fails.
- Brand solved this with `preprocess` + `z.coerce.number()`; the attribute form solved it with a number input and `onChange={(e) => field.onChange(e.target.value === '' ? null : +e.target.value)}`.
- Fix: use the attribute approach (map `''` → `undefined` here, since the column is NOT NULL with default 0).

### K2. MEDIUM (UI) — Default filter hides Draft rows with no indication
- `index.tsx:39` initialises `status: 'Published'`, but the status dropdown shows its placeholder and the Reset button stays hidden (`isFiltered` is false).
- After Reset (`resetForm` → `status: undefined`) or after clearing the dropdown (`value || ''`) the list shows all statuses, so the same screen shows different data depending on history.
- Fix: default `status` to `undefined`, or pass the initial value into the filter so the dropdown reflects it.

### K3. MEDIUM (API) — `status` query param unvalidated → 500
- `category.controller.ts:36`. Same fix as B3.

### K4. MEDIUM (API) — A soft-deleted category name cannot be reused
- `@@unique([storeCode, name])` (`schema.prisma:207`) includes rows with `deletedAt` set → "A category with this name already exists." after a delete.
- Fix: partial unique index `WHERE "deletedAt" IS NULL` via a raw migration, or suffix the name on delete.

### K5. MEDIUM (UI) — Parent category cannot be cleared once chosen
- `add-edit/index.tsx:97-98` builds `parentOptions` with no "None / top level" entry, so `onChange(value ? Number(value) : null)` can never receive an empty value.
- The list also uses `showAllRecords: true`, so Draft categories are offered as parents.
- Fix: prepend `{ value: '', label: 'None (top level)' }`.

### K6. LOW (API) — Create/update responses leak `storeCode` and `metadata`
- `category.service.ts:30,68` return the raw Prisma row (no `select`), while reads use `categorySelect` that withholds both. `attribute.service.ts:14,41` leak `storeCode` the same way. Brand passes `brandNameSelect` correctly.
- Fix: export `categorySelect` / `attributeSelect` and pass them to `create`/`update`.

### K7. LOW (API) — No way to filter root categories
- `category.controller.ts:35` uses `req.query['parentId'] ? parseInt(...)`, so `parentId=null` / root-only cannot be expressed. Optional.

### K8. LOW (UI) — Dead sorting and leftovers
- `index.tsx:60` `useTanstackTableSorting('name','asc')` never feeds `filterParams`; every column is `enableSorting: false`.
- `row-action.tsx` is unused (columns render `ActionTooltip` inline).
- `add-edit/index.tsx:27` `modalHeading: 'Add Grade'`.

### K9. LOW (UI) — Misleading comment
- `index.tsx:98-99` says HttpService throws on 409, but `HttpService.call()` resolves anything `< 500`, so the `catch` branch is dead. Harmless, both branches toast the message.

---

## 4. Attributes

### A1. HIGH (security) — No tenant scoping on read / update / delete
- `apps/api/src/services/attribute.service.ts:31-62` and `repository/attribute.repository.ts:73-82` look up by `id` only; `attribute.controller.ts:40-60` never passes `storeCode`.
- Failure: staff of store A can `GET /attributes/<id>`, `PUT`, or `DELETE` store B's attributes. Brand (`storeCode_id`) and category (`findFirst({ id, storeCode })`) are scoped; the attribute model already has `@@unique([storeCode, id])` (`schema.prisma:534`).
- Fix: mirror brand-name: `findUnique({ where: { storeCode_id: { storeCode, id } } })`, thread `storeCode` from `req.user` through the service interface.

### A2. MEDIUM (API) — `status=Trash` filter returns nothing
- `attribute.repository.ts:26` initialises `where.NOT = { status: Trash }`; lines 36-40 then set `where.status = Trash` without clearing `NOT`, producing `status = Trash AND status <> Trash`.
- Fix: only set `where.NOT` in the `else` branch (drop the initialiser).

### A3. MEDIUM (schema) — No unique name per store
- `schema.prisma:522-537` has no `@@unique([storeCode, name])`, unlike brand and category, so "Color" can be created repeatedly. Add the constraint if names are meant to be unique.

### A4. LOW (API) — Default status mismatch
- DB default `Published` (`schema.prisma:527`); service default `Draft` (`attribute.service.ts:19`); category has the same split (`schema.prisma:185` vs `category.service.ts:36`). The forms always send `status`, so this only bites API-only callers, but align them.

### A5. LOW (API) — See B5 (no product-in-use guard) and B6 (204 with body).

### A6. LOW (UI) — Name column claims to be sortable but nothing sorts
- `columns.tsx:26` `enableSorting: true` with `manualSorting: true`, but `index.tsx` never sends `sortBy`/`sortDirection`, and the attribute endpoint accepts no sort params (hard-coded `createdAt desc`). Either remove `enableSorting` or add sort support like brand.

### A7. LOW (UI) — Duplicate local types
- `apps/web/src/models/attribute.model.ts` and `params/attribute.params.ts` duplicate `@pms/types` with looser types (`status?: string | null`); `hooks/service-hooks/useAttributeService.ts:3` imports `CreateAttributeModel`/`UpdateAttributeModel` and never uses them. Delete the local copies and use `AttributeFilterParams` from `@pms/types`.

### A8. LOW (UI) — Trashed attributes are unreachable
- Filter options exclude Trash (`filter.tsx:15-18`); combined with A2 there is no way to see or restore a deleted attribute.

---

## 5. Cross-cutting (affects all four modules)

### X1. MEDIUM — The 401 auto-refresh interceptor never runs
- `apps/web/src/services/HttpService.ts:41-43` sets `validateStatus: status < 500`, so a 401 **resolves** as a normal response and never reaches the rejected-branch interceptor at line 57-110. The same applies to the 403 → `/access-denied` redirect.
- Effect: when the access token expires, every list/mutation in these modules just receives a resolved 401 body; nothing refreshes or logs out, and the hooks (which only invalidate on 200/201/204) silently show stale data.
- Fix: `validateStatus: (s) => s < 400` (then handle 4xx in `catch`), or move the refresh logic into the fulfilled handler.

### X2. LOW — Delete status codes differ per module
- Attribute/brand: 204 (body dropped). Category: 200 with body. The hooks each check a different code (`useDeleteAttribute` 204, `useDeleteCategory` 200), so a change on one side silently stops list invalidation. Standardise.

### X3. LOW — Repeated `showAllRecords` semantics
- Brand ignores the Trash filter under `showAll` (B1); attribute and category do not. Make `showAllRecords` mean "no pagination" only, and never widen the status filter.

---

## Suggested fix order

1. C1, A1 (security)
2. C2 (cart page breaks on multi-variant products), B2 (brand form locks), K1 (category display order), B1 (deleted brands listed)
3. X1 (token refresh), B3/K3 (500 on bad status), A2, C3, C4, C5
4. Everything else as cleanup
