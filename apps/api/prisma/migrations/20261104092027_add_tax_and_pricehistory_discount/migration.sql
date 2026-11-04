-- CreateEnum
CREATE TYPE "TaxCategory" AS ENUM ('TAXABLE', 'EXEMPT', 'ZERO_RATED', 'NON_GST');

-- CreateEnum
CREATE TYPE "TaxType" AS ENUM ('WithTax', 'WithoutTax');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FLAT');

-- AlterTable
ALTER TABLE "PriceHistory" ADD COLUMN     "discountType" "DiscountType",
ADD COLUMN     "discountValue" DECIMAL(12,2),
ADD COLUMN     "taxId" UUID,
ADD COLUMN     "taxType" "TaxType";

-- AlterTable
ALTER TABLE "product" ADD COLUMN     "taxId" UUID;

-- CreateTable
CREATE TABLE "taxes" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "category" "TaxCategory" NOT NULL DEFAULT 'TAXABLE',
    "description" VARCHAR(255),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "taxes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "taxes_code_key" ON "taxes"("code");

-- CreateIndex
CREATE INDEX "taxes_category_isActive_idx" ON "taxes"("category", "isActive");

-- CreateIndex
CREATE INDEX "taxes_deletedAt_idx" ON "taxes"("deletedAt");

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "taxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "taxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
