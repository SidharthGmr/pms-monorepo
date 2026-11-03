-- AlterTable
ALTER TABLE "PriceHistory" ADD COLUMN "isOffer" BOOLEAN NOT NULL DEFAULT false;

-- The flag used to live only on ProductVariant, so the rows in force inherit what the
-- variant says today; older rows keep the default, since their offer state was never recorded.
UPDATE "PriceHistory" p
SET "isOffer" = true
FROM "ProductVariant" v
WHERE p."variantId" = v."id"
  AND p."isCurrent" = true
  AND v."isOffer" = true;
