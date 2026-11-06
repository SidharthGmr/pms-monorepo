-- AlterTable
ALTER TABLE "estimate" ADD COLUMN     "publicToken" TEXT;

-- AlterTable
ALTER TABLE "order" ADD COLUMN     "publicToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "estimate_publicToken_key" ON "estimate"("publicToken");

-- CreateIndex
CREATE UNIQUE INDEX "order_publicToken_key" ON "order"("publicToken");
