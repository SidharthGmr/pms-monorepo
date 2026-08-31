-- DropIndex
DROP INDEX "Wishlist_userId_productId_key";

-- AlterTable
ALTER TABLE "Wishlist" ADD COLUMN     "variantId" INTEGER;

-- CreateIndex
CREATE INDEX "Wishlist_variantId_idx" ON "Wishlist"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_userId_productId_variantId_key" ON "Wishlist"("userId", "productId", "variantId");

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

