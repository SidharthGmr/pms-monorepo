-- AlterTable
ALTER TABLE "brandName" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "category" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
