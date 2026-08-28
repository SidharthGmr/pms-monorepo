-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "ratingCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "VariantRating" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "variantId" INTEGER NOT NULL,
    "storeCode" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VariantRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VariantRating_variantId_idx" ON "VariantRating"("variantId");

-- CreateIndex
CREATE INDEX "VariantRating_storeCode_idx" ON "VariantRating"("storeCode");

-- CreateIndex
CREATE UNIQUE INDEX "VariantRating_userId_variantId_key" ON "VariantRating"("userId", "variantId");

-- AddForeignKey
ALTER TABLE "VariantRating" ADD CONSTRAINT "VariantRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantRating" ADD CONSTRAINT "VariantRating_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantRating" ADD CONSTRAINT "VariantRating_storeCode_fkey" FOREIGN KEY ("storeCode") REFERENCES "store"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
