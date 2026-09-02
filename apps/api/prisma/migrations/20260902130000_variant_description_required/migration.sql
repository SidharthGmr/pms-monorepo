UPDATE "ProductVariant" v
SET "description" = p."description"
FROM "product" p
WHERE p."id" = v."productId"
  AND p."storeCode" = v."storeCode"
  AND v."description" IS NULL
  AND p."description" IS NOT NULL
  AND p."description" <> '';

UPDATE "ProductVariant"
SET "description" = "name"
WHERE "description" IS NULL;

ALTER TABLE "ProductVariant" ALTER COLUMN "description" SET NOT NULL;
