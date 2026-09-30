-- Review fixes, 2026-09-30 (see REVIEW-REPORT-2026-09-30.md).
--
-- Hand-written, not generated: the partial unique indexes below cannot be declared in the
-- Prisma 5 schema. schema.prisma documents each one next to its model. If a later
-- `prisma migrate dev` generates DROP INDEX for any of them, delete that line before applying.
--
-- The API code depends on this migration (CartRepository uses ON CONFLICT against
-- "Cart_active_owner_key"), so apply it before deploying: `npx prisma migrate deploy`.

-- C6: 'IND' is not an ISO 4217 code. Default to INR and fix carts created with 'IND'.
ALTER TABLE "Cart" ALTER COLUMN "currency" SET DEFAULT 'INR';
UPDATE "Cart" SET "currency" = 'INR' WHERE "currency" = 'IND';

-- A4: new rows default to Draft, matching what the services write and what product uses.
ALTER TABLE "attribute" ALTER COLUMN "status" SET DEFAULT 'Draft';
ALTER TABLE "brandName" ALTER COLUMN "status" SET DEFAULT 'Draft';
ALTER TABLE "category" ALTER COLUMN "status" SET DEFAULT 'Draft';

-- C5: one ACTIVE cart per signed-in user and store.
-- Existing duplicates would block the index, so keep each owner's most recently updated
-- active cart and mark the older ones ABANDONED. Their items are left untouched.
UPDATE "Cart" AS c
SET "status" = 'ABANDONED'
FROM (
  SELECT "id",
         ROW_NUMBER() OVER (PARTITION BY "storeId", "userId" ORDER BY "updatedAt" DESC, "id" DESC) AS rn
  FROM "Cart"
  WHERE "status" = 'ACTIVE' AND "userId" IS NOT NULL
) AS d
WHERE c."id" = d."id" AND d.rn > 1;

CREATE UNIQUE INDEX "Cart_active_owner_key"
  ON "Cart" ("storeId", "userId")
  WHERE "status" = 'ACTIVE' AND "userId" IS NOT NULL;

-- B4: a trashed brand name no longer blocks re-creating the same name.
DROP INDEX "brandName_name_storeCode_key";
CREATE UNIQUE INDEX "brandName_storeCode_name_live_key"
  ON "brandName" ("storeCode", "name")
  WHERE "status" <> 'Trash';

-- K4: a soft-deleted category name no longer blocks re-creating the same name.
DROP INDEX "category_storeCode_name_key";
CREATE UNIQUE INDEX "category_storeCode_name_live_key"
  ON "category" ("storeCode", "name")
  WHERE "deletedAt" IS NULL;

-- A3: attribute names are unique per store, ignoring Trash, like brand names.
-- Attributes never had this rule, so duplicates may exist. The oldest keeps its name; each
-- later duplicate gets its id appended, e.g. "Color (42)", so the index can be built.
-- Check first with:
--   SELECT "storeCode", "name", COUNT(*) FROM "attribute" WHERE "status" <> 'Trash'
--   GROUP BY 1, 2 HAVING COUNT(*) > 1;
UPDATE "attribute" AS a
SET "name" = a."name" || ' (' || a."id" || ')'
FROM (
  SELECT "id",
         ROW_NUMBER() OVER (PARTITION BY "storeCode", "name" ORDER BY "createdAt", "id") AS rn
  FROM "attribute"
  WHERE "status" <> 'Trash'
) AS d
WHERE a."id" = d."id" AND d.rn > 1;

CREATE UNIQUE INDEX "attribute_storeCode_name_live_key"
  ON "attribute" ("storeCode", "name")
  WHERE "status" <> 'Trash';
