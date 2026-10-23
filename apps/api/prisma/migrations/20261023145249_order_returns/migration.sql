-- CreateEnum
CREATE TYPE "ReturnType" AS ENUM ('REFUND', 'EXCHANGE');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'APPROVED', 'RECEIVED', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReturnItemCondition" AS ENUM ('SELLABLE', 'DAMAGED');

-- AlterTable
ALTER TABLE "order" ADD COLUMN     "deliveredAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "store" ADD COLUMN     "returnWindowDays" INTEGER NOT NULL DEFAULT 3;

-- CreateTable
CREATE TABLE "orderReturn" (
    "id" SERIAL NOT NULL,
    "returnNumber" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,
    "storeCode" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "ReturnType" NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "refundAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "refundMethod" "PaymentMethod",
    "refundTransactionId" TEXT,
    "exchangeOrderId" INTEGER,
    "requestedById" TEXT NOT NULL,
    "processedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orderReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orderReturnItem" (
    "id" SERIAL NOT NULL,
    "returnId" INTEGER NOT NULL,
    "orderItemId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "variantId" INTEGER NOT NULL,
    "storeCode" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "condition" "ReturnItemCondition" NOT NULL DEFAULT 'SELLABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orderReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orderReturn_returnNumber_key" ON "orderReturn"("returnNumber");

-- CreateIndex
CREATE INDEX "orderReturn_storeCode_idx" ON "orderReturn"("storeCode");

-- CreateIndex
CREATE INDEX "orderReturn_orderId_idx" ON "orderReturn"("orderId");

-- CreateIndex
CREATE INDEX "orderReturn_status_idx" ON "orderReturn"("status");

-- CreateIndex
CREATE INDEX "orderReturn_returnNumber_idx" ON "orderReturn"("returnNumber");

-- CreateIndex
CREATE INDEX "orderReturnItem_returnId_idx" ON "orderReturnItem"("returnId");

-- CreateIndex
CREATE INDEX "orderReturnItem_orderItemId_idx" ON "orderReturnItem"("orderItemId");

-- CreateIndex
CREATE INDEX "orderReturnItem_variantId_idx" ON "orderReturnItem"("variantId");

-- CreateIndex
CREATE INDEX "orderReturnItem_storeCode_idx" ON "orderReturnItem"("storeCode");

-- AddForeignKey
ALTER TABLE "orderReturn" ADD CONSTRAINT "orderReturn_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderReturn" ADD CONSTRAINT "orderReturn_exchangeOrderId_fkey" FOREIGN KEY ("exchangeOrderId") REFERENCES "order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderReturn" ADD CONSTRAINT "orderReturn_storeCode_fkey" FOREIGN KEY ("storeCode") REFERENCES "store"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderReturn" ADD CONSTRAINT "orderReturn_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderReturnItem" ADD CONSTRAINT "orderReturnItem_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "orderReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderReturnItem" ADD CONSTRAINT "orderReturnItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "orderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderReturnItem" ADD CONSTRAINT "orderReturnItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderReturnItem" ADD CONSTRAINT "orderReturnItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderReturnItem" ADD CONSTRAINT "orderReturnItem_storeCode_fkey" FOREIGN KEY ("storeCode") REFERENCES "store"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

