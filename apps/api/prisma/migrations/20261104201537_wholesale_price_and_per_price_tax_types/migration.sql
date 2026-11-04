-- Rename, not drop+add: both columns carry live ledger data that must survive.
ALTER TABLE "PriceHistory" RENAME COLUMN "offerPrice" TO "wholesalePrice";
ALTER TABLE "PriceHistory" RENAME COLUMN "taxType" TO "saleTaxType";
ALTER TABLE "PriceHistory" ADD COLUMN "purchaseTaxType" "TaxType";
ALTER TABLE "PriceHistory" ADD COLUMN "wholesaleTaxType" "TaxType";
