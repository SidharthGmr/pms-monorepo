-- AlterTable
ALTER TABLE "order" ADD COLUMN     "isInterState" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "product" ADD COLUMN     "hsnCode" TEXT;

