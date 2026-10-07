-- PriceHistory.productId: added nullable so the existing rows survive, backfilled from each
-- row's variant, then made required and tied to the product by the same (storeCode, id) key
-- every other tenant-scoped relation uses.
ALTER TABLE "PriceHistory" ADD COLUMN "productId" INTEGER;

UPDATE "PriceHistory" ph
SET "productId" = pv."productId"
FROM "ProductVariant" pv
WHERE pv."id" = ph."variantId";

ALTER TABLE "PriceHistory" ALTER COLUMN "productId" SET NOT NULL;

ALTER TABLE "PriceHistory"
    ADD CONSTRAINT "PriceHistory_storeCode_productId_fkey"
    FOREIGN KEY ("storeCode", "productId") REFERENCES "product"("storeCode", "id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- PriceHistory.isCurrent: true on the one row per variant in force right now. Backfilled with the
-- same rule the API prices through - the latest row that has started and has not been superseded.
ALTER TABLE "PriceHistory" ADD COLUMN "isCurrent" BOOLEAN NOT NULL DEFAULT false;

UPDATE "PriceHistory"
SET "isCurrent" = true
WHERE "id" IN (
    SELECT DISTINCT ON ("variantId") "id"
    FROM "PriceHistory"
    WHERE "deletedAt" IS NULL
      AND "effectiveFrom" <= now()
      AND ("effectiveTo" IS NULL OR "effectiveTo" > now())
    ORDER BY "variantId", "effectiveFrom" DESC, "id" DESC
);

CREATE INDEX "PriceHistory_storeCode_variantId_isCurrent_idx" ON "PriceHistory"("storeCode", "variantId", "isCurrent");
