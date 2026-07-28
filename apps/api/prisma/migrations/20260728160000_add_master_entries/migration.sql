-- CreateTable
CREATE TABLE "MasterAttribute" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT,
    "storeCode" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'Published',
    "displayOrder" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "MasterAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterEntry" (
    "id" SERIAL NOT NULL,
    "attributeId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "colorHex" TEXT,
    "metadata" JSONB,
    "storeCode" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'Published',
    "displayOrder" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "MasterEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MasterAttribute_storeCode_idx" ON "MasterAttribute"("storeCode");

-- CreateIndex
CREATE UNIQUE INDEX "MasterAttribute_code_storeCode_key" ON "MasterAttribute"("code", "storeCode");

-- CreateIndex
CREATE UNIQUE INDEX "MasterAttribute_name_storeCode_key" ON "MasterAttribute"("name", "storeCode");

-- CreateIndex
CREATE INDEX "MasterEntry_attributeId_idx" ON "MasterEntry"("attributeId");

-- CreateIndex
CREATE INDEX "MasterEntry_storeCode_idx" ON "MasterEntry"("storeCode");

-- CreateIndex
CREATE UNIQUE INDEX "MasterEntry_attributeId_value_key" ON "MasterEntry"("attributeId", "value");

-- AddForeignKey
ALTER TABLE "MasterAttribute" ADD CONSTRAINT "MasterAttribute_storeCode_fkey" FOREIGN KEY ("storeCode") REFERENCES "store"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterEntry" ADD CONSTRAINT "MasterEntry_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "MasterAttribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterEntry" ADD CONSTRAINT "MasterEntry_storeCode_fkey" FOREIGN KEY ("storeCode") REFERENCES "store"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
