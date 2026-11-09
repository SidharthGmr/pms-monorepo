-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RecurrenceInterval" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateTable
CREATE TABLE "expense" (
    "id" SERIAL NOT NULL,
    "storeCode" TEXT NOT NULL,
    "expenseNumber" TEXT NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "expenseAccountId" INTEGER NOT NULL,
    "paidFromAccountId" INTEGER,
    "supplierId" INTEGER,
    "partyType" "PartyType",
    "partyId" TEXT,
    "referenceNumber" TEXT,
    "notes" TEXT,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'DRAFT',
    "amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxId" UUID,
    "taxName" TEXT,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxType" "TaxType",
    "taxableAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "isInterState" BOOLEAN NOT NULL DEFAULT false,
    "attachments" TEXT[],
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "templateId" INTEGER,
    "recurrenceInterval" "RecurrenceInterval",
    "recurrenceNextDate" TIMESTAMP(3),
    "recurrenceEndDate" TIMESTAMP(3),
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expense_storeCode_status_idx" ON "expense"("storeCode", "status");

-- CreateIndex
CREATE INDEX "expense_storeCode_expenseDate_idx" ON "expense"("storeCode", "expenseDate");

-- CreateIndex
CREATE INDEX "expense_storeCode_expenseAccountId_idx" ON "expense"("storeCode", "expenseAccountId");

-- CreateIndex
CREATE INDEX "expense_storeCode_supplierId_idx" ON "expense"("storeCode", "supplierId");

-- CreateIndex
CREATE INDEX "expense_storeCode_isTemplate_idx" ON "expense"("storeCode", "isTemplate");

-- CreateIndex
CREATE INDEX "expense_storeCode_deletedAt_idx" ON "expense"("storeCode", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "expense_storeCode_expenseNumber_key" ON "expense"("storeCode", "expenseNumber");

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_storeCode_fkey" FOREIGN KEY ("storeCode") REFERENCES "store"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_storeCode_expenseAccountId_fkey" FOREIGN KEY ("storeCode", "expenseAccountId") REFERENCES "ledgerAccount"("storeCode", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_storeCode_paidFromAccountId_fkey" FOREIGN KEY ("storeCode", "paidFromAccountId") REFERENCES "ledgerAccount"("storeCode", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "taxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "expense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

