-- AlterTable
ALTER TABLE "MasterAttribute" ADD COLUMN     "brandNameId" INTEGER,
ADD COLUMN     "categoryId" INTEGER;

-- CreateIndex
CREATE INDEX "MasterAttribute_storeCode_categoryId_idx" ON "MasterAttribute"("storeCode", "categoryId");

-- CreateIndex
CREATE INDEX "MasterAttribute_storeCode_brandNameId_idx" ON "MasterAttribute"("storeCode", "brandNameId");

-- AddForeignKey
ALTER TABLE "MasterAttribute" ADD CONSTRAINT "MasterAttribute_storeCode_categoryId_fkey" FOREIGN KEY ("storeCode", "categoryId") REFERENCES "category"("storeCode", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterAttribute" ADD CONSTRAINT "MasterAttribute_storeCode_brandNameId_fkey" FOREIGN KEY ("storeCode", "brandNameId") REFERENCES "brandName"("storeCode", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
