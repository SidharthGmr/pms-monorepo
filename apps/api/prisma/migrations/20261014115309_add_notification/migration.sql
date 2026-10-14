-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('USER_REGISTERED', 'ORDER_PLACED', 'ORDER_STATUS_CHANGED', 'LOW_STOCK');

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "storeCode" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_recipientId_isRead_idx" ON "Notification"("recipientId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_recipientId_createdAt_idx" ON "Notification"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_storeCode_type_isRead_idx" ON "Notification"("storeCode", "type", "isRead");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_storeCode_fkey" FOREIGN KEY ("storeCode") REFERENCES "store"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
