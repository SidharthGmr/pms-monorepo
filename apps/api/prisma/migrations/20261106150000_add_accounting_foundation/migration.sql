-- CreateEnum
CREATE TYPE "AccountCategory" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "AccountSubType" AS ENUM ('CASH', 'BANK', 'RECEIVABLE', 'PAYABLE', 'TAX_INPUT', 'TAX_OUTPUT', 'INVENTORY', 'OTHER');

-- CreateEnum
CREATE TYPE "VoucherType" AS ENUM ('OPENING', 'JOURNAL', 'SALES', 'SALES_RETURN', 'PURCHASE', 'PURCHASE_RETURN', 'RECEIPT', 'PAYMENT', 'CONTRA', 'EXPENSE');

-- CreateEnum
CREATE TYPE "JournalStatus" AS ENUM ('POSTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "PartyType" AS ENUM ('CUSTOMER', 'SUPPLIER', 'STAFF', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "AllocationTargetType" AS ENUM ('ORDER', 'PURCHASE', 'EXPENSE');

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "gstin" TEXT;

-- AlterTable
ALTER TABLE "payment" ADD COLUMN     "direction" "PaymentDirection" NOT NULL DEFAULT 'IN',
ADD COLUMN     "ledgerAccountId" INTEGER,
ADD COLUMN     "partyId" TEXT,
ADD COLUMN     "partyType" "PartyType",
ADD COLUMN     "voucherNumber" TEXT,
ALTER COLUMN "orderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "store" ADD COLUMN     "gstin" TEXT,
ADD COLUMN     "stateCode" TEXT;

-- AlterTable
ALTER TABLE "supplier" ADD COLUMN     "gstin" TEXT,
ADD COLUMN     "stateCode" TEXT;

-- CreateTable
CREATE TABLE "ledgerAccount" (
    "id" SERIAL NOT NULL,
    "storeCode" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "AccountCategory" NOT NULL,
    "subType" "AccountSubType" NOT NULL DEFAULT 'OTHER',
    "parentId" INTEGER,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "systemKey" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" "Status" NOT NULL DEFAULT 'Published',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "ledgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financialYear" (
    "id" SERIAL NOT NULL,
    "storeCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "financialYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journalEntry" (
    "id" SERIAL NOT NULL,
    "storeCode" TEXT NOT NULL,
    "voucherNumber" TEXT NOT NULL,
    "voucherType" "VoucherType" NOT NULL DEFAULT 'JOURNAL',
    "entryDate" TIMESTAMP(3) NOT NULL,
    "narration" TEXT,
    "referenceNumber" TEXT,
    "sourceType" TEXT,
    "sourceId" INTEGER,
    "financialYearId" INTEGER,
    "status" "JournalStatus" NOT NULL DEFAULT 'POSTED',
    "reversesEntryId" INTEGER,
    "reversedAt" TIMESTAMP(3),
    "totalDebit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalCredit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "isOpening" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journalLine" (
    "id" SERIAL NOT NULL,
    "storeCode" TEXT NOT NULL,
    "journalEntryId" INTEGER NOT NULL,
    "ledgerAccountId" INTEGER NOT NULL,
    "debit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "narration" TEXT,
    "partyType" "PartyType",
    "partyId" TEXT,
    "lineOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journalLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paymentAllocation" (
    "id" SERIAL NOT NULL,
    "storeCode" TEXT NOT NULL,
    "paymentId" INTEGER NOT NULL,
    "targetType" "AllocationTargetType" NOT NULL,
    "targetId" INTEGER NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "paymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accountingAuditLog" (
    "id" SERIAL NOT NULL,
    "storeCode" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER,
    "summary" TEXT NOT NULL,
    "detail" JSONB,
    "performedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accountingAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ledgerAccount_storeCode_category_idx" ON "ledgerAccount"("storeCode", "category");

-- CreateIndex
CREATE INDEX "ledgerAccount_storeCode_parentId_idx" ON "ledgerAccount"("storeCode", "parentId");

-- CreateIndex
CREATE INDEX "ledgerAccount_storeCode_isActive_idx" ON "ledgerAccount"("storeCode", "isActive");

-- CreateIndex
CREATE INDEX "ledgerAccount_storeCode_status_idx" ON "ledgerAccount"("storeCode", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ledgerAccount_storeCode_id_key" ON "ledgerAccount"("storeCode", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ledgerAccount_storeCode_code_key" ON "ledgerAccount"("storeCode", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ledgerAccount_storeCode_systemKey_key" ON "ledgerAccount"("storeCode", "systemKey");

-- CreateIndex
CREATE INDEX "financialYear_storeCode_startDate_idx" ON "financialYear"("storeCode", "startDate");

-- CreateIndex
CREATE INDEX "financialYear_storeCode_isClosed_idx" ON "financialYear"("storeCode", "isClosed");

-- CreateIndex
CREATE UNIQUE INDEX "financialYear_storeCode_name_key" ON "financialYear"("storeCode", "name");

-- CreateIndex
CREATE UNIQUE INDEX "journalEntry_reversesEntryId_key" ON "journalEntry"("reversesEntryId");

-- CreateIndex
CREATE INDEX "journalEntry_storeCode_entryDate_idx" ON "journalEntry"("storeCode", "entryDate");

-- CreateIndex
CREATE INDEX "journalEntry_storeCode_voucherType_entryDate_idx" ON "journalEntry"("storeCode", "voucherType", "entryDate");

-- CreateIndex
CREATE INDEX "journalEntry_storeCode_status_idx" ON "journalEntry"("storeCode", "status");

-- CreateIndex
CREATE INDEX "journalEntry_storeCode_financialYearId_idx" ON "journalEntry"("storeCode", "financialYearId");

-- CreateIndex
CREATE UNIQUE INDEX "journalEntry_storeCode_voucherNumber_key" ON "journalEntry"("storeCode", "voucherNumber");

-- CreateIndex
CREATE UNIQUE INDEX "journalEntry_storeCode_sourceType_sourceId_key" ON "journalEntry"("storeCode", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "journalLine_journalEntryId_idx" ON "journalLine"("journalEntryId");

-- CreateIndex
CREATE INDEX "journalLine_storeCode_ledgerAccountId_idx" ON "journalLine"("storeCode", "ledgerAccountId");

-- CreateIndex
CREATE INDEX "journalLine_storeCode_partyType_partyId_idx" ON "journalLine"("storeCode", "partyType", "partyId");

-- CreateIndex
CREATE INDEX "paymentAllocation_storeCode_targetType_targetId_idx" ON "paymentAllocation"("storeCode", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "paymentAllocation_paymentId_idx" ON "paymentAllocation"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "paymentAllocation_paymentId_targetType_targetId_key" ON "paymentAllocation"("paymentId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "accountingAuditLog_storeCode_createdAt_idx" ON "accountingAuditLog"("storeCode", "createdAt");

-- CreateIndex
CREATE INDEX "accountingAuditLog_storeCode_entityType_entityId_idx" ON "accountingAuditLog"("storeCode", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "payment_storeCode_direction_paymentDate_idx" ON "payment"("storeCode", "direction", "paymentDate");

-- CreateIndex
CREATE INDEX "payment_storeCode_partyType_partyId_idx" ON "payment"("storeCode", "partyType", "partyId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_storeCode_voucherNumber_key" ON "payment"("storeCode", "voucherNumber");

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_storeCode_ledgerAccountId_fkey" FOREIGN KEY ("storeCode", "ledgerAccountId") REFERENCES "ledgerAccount"("storeCode", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledgerAccount" ADD CONSTRAINT "ledgerAccount_storeCode_fkey" FOREIGN KEY ("storeCode") REFERENCES "store"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledgerAccount" ADD CONSTRAINT "ledgerAccount_storeCode_parentId_fkey" FOREIGN KEY ("storeCode", "parentId") REFERENCES "ledgerAccount"("storeCode", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financialYear" ADD CONSTRAINT "financialYear_storeCode_fkey" FOREIGN KEY ("storeCode") REFERENCES "store"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financialYear" ADD CONSTRAINT "financialYear_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "users"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journalEntry" ADD CONSTRAINT "journalEntry_storeCode_fkey" FOREIGN KEY ("storeCode") REFERENCES "store"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journalEntry" ADD CONSTRAINT "journalEntry_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES "financialYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journalEntry" ADD CONSTRAINT "journalEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journalEntry" ADD CONSTRAINT "journalEntry_reversesEntryId_fkey" FOREIGN KEY ("reversesEntryId") REFERENCES "journalEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journalLine" ADD CONSTRAINT "journalLine_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journalLine" ADD CONSTRAINT "journalLine_storeCode_ledgerAccountId_fkey" FOREIGN KEY ("storeCode", "ledgerAccountId") REFERENCES "ledgerAccount"("storeCode", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journalLine" ADD CONSTRAINT "journalLine_storeCode_fkey" FOREIGN KEY ("storeCode") REFERENCES "store"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paymentAllocation" ADD CONSTRAINT "paymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paymentAllocation" ADD CONSTRAINT "paymentAllocation_storeCode_fkey" FOREIGN KEY ("storeCode") REFERENCES "store"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paymentAllocation" ADD CONSTRAINT "paymentAllocation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accountingAuditLog" ADD CONSTRAINT "accountingAuditLog_storeCode_fkey" FOREIGN KEY ("storeCode") REFERENCES "store"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accountingAuditLog" ADD CONSTRAINT "accountingAuditLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
