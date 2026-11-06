-- CreateEnum
CREATE TYPE "EstimateStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "estimate" (
    "id" SERIAL NOT NULL,
    "estimateNumber" TEXT NOT NULL,
    "storeCode" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "billingAddress" TEXT,
    "shippingAddress" TEXT,
    "estimateDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "referenceNumber" TEXT,
    "notes" TEXT,
    "terms" TEXT,
    "status" "EstimateStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "itemDiscountTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "additionalDiscountType" "DiscountType",
    "additionalDiscountValue" DECIMAL(12,2),
    "additionalDiscount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxableAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "cgstAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "sgstAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "igstAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "shippingCharges" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "adjustment" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "isInterState" BOOLEAN NOT NULL DEFAULT false,
    "convertedOrderId" INTEGER,
    "convertedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "estimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimateItem" (
    "id" SERIAL NOT NULL,
    "estimateId" INTEGER NOT NULL,
    "storeCode" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "variantId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "variantName" TEXT,
    "sku" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "discountType" "DiscountType",
    "discountValue" DECIMAL(12,2),
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxId" UUID,
    "taxName" TEXT,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxType" "TaxType",
    "taxableAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estimateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimateStatusHistory" (
    "id" SERIAL NOT NULL,
    "estimateId" INTEGER NOT NULL,
    "fromStatus" "EstimateStatus",
    "toStatus" "EstimateStatus" NOT NULL,
    "note" TEXT,
    "changedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estimateStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "estimate_convertedOrderId_key" ON "estimate"("convertedOrderId");

-- CreateIndex
CREATE INDEX "estimate_storeCode_status_idx" ON "estimate"("storeCode", "status");

-- CreateIndex
CREATE INDEX "estimate_storeCode_estimateDate_idx" ON "estimate"("storeCode", "estimateDate");

-- CreateIndex
CREATE INDEX "estimate_storeCode_customerId_idx" ON "estimate"("storeCode", "customerId");

-- CreateIndex
CREATE INDEX "estimate_storeCode_deletedAt_idx" ON "estimate"("storeCode", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "estimate_storeCode_estimateNumber_key" ON "estimate"("storeCode", "estimateNumber");

-- CreateIndex
CREATE INDEX "estimateItem_estimateId_idx" ON "estimateItem"("estimateId");

-- CreateIndex
CREATE INDEX "estimateItem_storeCode_idx" ON "estimateItem"("storeCode");

-- CreateIndex
CREATE INDEX "estimateItem_variantId_idx" ON "estimateItem"("variantId");

-- CreateIndex
CREATE INDEX "estimateStatusHistory_estimateId_idx" ON "estimateStatusHistory"("estimateId");

-- AddForeignKey
ALTER TABLE "estimate" ADD CONSTRAINT "estimate_storeCode_fkey" FOREIGN KEY ("storeCode") REFERENCES "store"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate" ADD CONSTRAINT "estimate_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate" ADD CONSTRAINT "estimate_convertedOrderId_fkey" FOREIGN KEY ("convertedOrderId") REFERENCES "order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate" ADD CONSTRAINT "estimate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimateItem" ADD CONSTRAINT "estimateItem_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimateItem" ADD CONSTRAINT "estimateItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimateItem" ADD CONSTRAINT "estimateItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimateItem" ADD CONSTRAINT "estimateItem_storeCode_fkey" FOREIGN KEY ("storeCode") REFERENCES "store"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimateStatusHistory" ADD CONSTRAINT "estimateStatusHistory_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimateStatusHistory" ADD CONSTRAINT "estimateStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
