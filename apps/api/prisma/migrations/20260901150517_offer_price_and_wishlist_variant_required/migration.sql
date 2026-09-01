-- AlterTable
ALTER TABLE "PriceHistory" ADD COLUMN     "offerPrice" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "isOffer" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Wishlist" ALTER COLUMN "variantId" SET NOT NULL;

