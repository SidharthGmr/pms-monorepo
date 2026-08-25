-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "description" TEXT,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoTitle" VARCHAR(255),
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'Draft';
