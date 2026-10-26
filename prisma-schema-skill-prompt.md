# Skill Prompt — Production Prisma Schema, Migrations & Seeding

> Use this file as the body of a `SKILL.md`. Suggested frontmatter:
>
> ```yaml
> ---
> name: prisma-schema-builder
> description: Design and evolve a production Prisma/PostgreSQL schema for a layered, multi-tenant REST API — model conventions (audit columns, soft delete, tenant composite keys, partial unique indexes), enum strategy, relation rules, the migrate dev/generate/deploy workflow, and a seed script that bootstraps the first SUPER_ADMIN and tenant so a fresh database is immediately usable. Use when the user wants to "design the database", "add a model/table", "add a migration", "seed the database", or "set up Prisma" in a new or existing project.
> ---
> ```

---

## THE PROMPT

You are designing the **database layer** for a production multi-tenant REST API (Prisma + PostgreSQL). One schema file (`prisma/schema.prisma`), migrations in `prisma/migrations/`. Every business model follows the same column recipe so repositories, services and the error handler can treat them uniformly.

### 1. The standard business model recipe

Every tenant-owned business table carries the same spine:

```prisma
model category {
  id          Int       @id @default(autoincrement())
  storeCode   String                                  // tenant key — a STRING code, not an id
  name        String
  status      Status    @default(Published)           // Published | Draft | Trash (soft-delete bucket)
  deletedAt   DateTime?                               // hard-ish soft delete for uniqueness scoping
  createdAt   DateTime  @default(now())
  updatedAt   DateTime? @updatedAt

  // Audit trail — who touched the row. Required on create, optional after:
  createdById String
  updatedById String?
  createdBy   users     @relation("CategoryCreatedBy", fields: [createdById], references: [userId], onDelete: Restrict)
  updatedBy   users?    @relation("CategoryUpdatedBy", fields: [updatedById], references: [userId], onDelete: SetNull)

  store       store     @relation(fields: [storeCode], references: [code])

  @@unique([storeCode, id])          // composite tenant key — see §2
  @@index([storeCode, deletedAt])    // the hot filter every list query uses
}
```

Rules baked into this recipe:

- **Tenant key is a stable string code** (`storeCode → store.code`), not the numeric id — it travels in JWTs and URLs without leaking row counts, and survives re-seeding.
- **Audit FKs**: `createdById` is required with `onDelete: Restrict` (you cannot delete a user who authored rows — history survives); `updatedById`/`deletedById` are optional with `onDelete: SetNull`. Name the relations (`"XCreatedBy"`) — multiple FKs to the same table require it.
- **Two delete mechanisms, used together**: `status: Trash` is the user-visible trash bin (restorable, excluded from lists by default); `deletedAt` is the timestamp that scopes uniqueness (§3). Repositories exclude `Trash` unless a status filter is passed.
- `updatedAt DateTime?` nullable with `@updatedAt` — a never-edited row shows `null`, which the UI reads as "never modified".

### 2. Multi-tenant access keys

Add `@@unique([storeCode, id])` to every tenant model. This gives Prisma a compound selector:

```ts
prisma.category.findUnique({ where: { storeCode_id: { storeCode, id } } })
```

…so `getById`/`update`/`delete` are **scoped to the caller's tenant at the database level**. A row in another tenant is simply not found — the API cannot be used to probe which ids exist elsewhere. This single convention is what makes the service layer's `findInTenant()` guard trustworthy.

Add natural-key uniques per tenant where the domain demands them: `@@unique([storeCode, slug])`, `@@unique([storeCode, sku])`, `@@unique([storeCode, barcode])`.

### 3. Partial unique indexes (uniqueness among *live* rows only)

"Name must be unique" almost always means *unique among non-deleted rows* — otherwise trashing "Shoes" forever blocks creating "Shoes" again. Prisma cannot declare partial indexes, so write them as **raw SQL inside a migration**:

```sql
CREATE UNIQUE INDEX category_storeCode_name_live_key
  ON "category" ("storeCode", "name") WHERE "deletedAt" IS NULL;
```

Two consequences you must handle:
- Document each one in a schema comment next to the model (`// Also unique: ... - partial index in migration`), or the next developer "fixes" the missing `@@unique`.
- On violation, Prisma's P2002 reports only the **index name**, not columns — keep a `RAW_UNIQUE_INDEX_COLUMNS` map in the API's error handler translating `category_storeCode_name_live_key → ['name']` so the user still gets "A category with this name already exists."

### 4. Enums and relations

- Define domain enums in the schema (`enum Status { Published Draft Trash }`, `Role`, `OrderStatus`, ...) and mirror each as a **string-union + runtime enum pair in the shared types package**. DTO fields use the union so Prisma enum values assign directly.
- Choose `onDelete` deliberately, never by default: `Restrict` for audit/author links and anything with financial history; `SetNull` for optional references; `Cascade` only for true child rows that are meaningless without the parent (session → user, orderItem → order).
- When a parent is referenced by children the user can still see, do **not** rely on FK errors alone — the service layer counts dependents first and returns a friendly 409 (the FK + P2003 mapping is the backstop).
- Index what list queries filter on: `[storeCode, deletedAt]` at minimum, plus FK columns and frequent sorts.

### 5. Migration workflow

```bash
npx prisma migrate dev --name add_category    # dev: create + apply + regenerate client
npx prisma generate                            # after any schema pull/merge (also on postinstall)
npx prisma migrate deploy                      # prod: apply pending migrations — SEPARATE from build
```

- Schema change and migration land **in the same commit** — CI runs `prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --exit-code` to catch drift.
- Never edit an applied migration; fix forward with a new one. Never baseline/`migrate resolve` against a shared database without the team agreeing — it rewrites history for everyone.
- Hand-edit a generated migration only to *add* things Prisma can't express (partial indexes, data backfills) — and backfill **inside the same migration** that adds a new required column (add nullable → backfill → set NOT NULL).
- If the dev database is shared or contains real data: no `migrate reset`, ever; test scripts clean up after themselves and verify row counts.

### 6. Seed — a fresh database must be usable immediately

A from-scratch project is dead until someone can log in. Ship `prisma/seed.ts` wired into `package.json`:

```jsonc
{ "prisma": { "seed": "ts-node prisma/seed.ts" } }
```

The seed must be **idempotent** (`upsert` on natural keys, safe to run twice) and create, in order:

```ts
// 1. The default tenant
const store = await prisma.store.upsert({
  where: { code: 'MAIN' },
  update: {},
  create: { code: 'MAIN', name: 'Main Store', isActive: true },
});

// 2. The first SUPER_ADMIN — credentials from env, never hardcoded
const password = process.env.SEED_ADMIN_PASSWORD;      // required; refuse to seed without it
await prisma.users.upsert({
  where: { email: process.env.SEED_ADMIN_EMAIL! },
  update: {},
  create: {
    userId: crypto.randomUUID(),
    email: process.env.SEED_ADMIN_EMAIL!,
    name: 'Super Admin',
    password: await bcrypt.hash(password!, 10),        // same hasher + cost as the auth module
    role: 'SUPER_ADMIN',
    storeCode: store.code,
    emailVerifiedAt: new Date(),                       // skip the verify loop for the bootstrap user
  },
});

// 3. Reference/master data the app assumes exists (default categories, settings rows, CMS pages)
```

Run `npx prisma db seed` after the first `migrate dev`/`migrate deploy`. In production, seed once via a one-off job — never automatically on boot.

### 7. Definition of done (for a schema change)

1. Model follows the recipe (§1) with tenant composite key, audit FKs, status + deletedAt, indexes.
2. Migration generated, committed with the schema, `migrate diff` clean; partial indexes documented in a comment and mapped in the API error handler.
3. `prisma generate` ran; shared types DTO/enum updated to match; API build green.
4. Seed still runs idempotently; a wiped database → `migrate deploy` + `db seed` → the SUPER_ADMIN can log in.
