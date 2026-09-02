UPDATE "ProductVariant" v
SET "name" = p."name"
FROM "product" p
WHERE p."id" = v."productId"
  AND p."storeCode" = v."storeCode"
  AND v."name" IS NULL;

UPDATE "ProductVariant"
SET "name" = 'Variant ' || "id"
WHERE "name" IS NULL;

UPDATE "ProductVariant"
SET "slug" = lower("sku")
WHERE "slug" IS NULL;

UPDATE "ProductVariant"
SET "lowStockThreshold" = 5
WHERE "lowStockThreshold" IS NULL;

ALTER TABLE "ProductVariant" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "lowStockThreshold" SET NOT NULL,
ALTER COLUMN "slug" SET NOT NULL;
