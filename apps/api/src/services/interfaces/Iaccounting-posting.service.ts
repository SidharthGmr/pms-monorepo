import { AccountingBackfillModel, AccountingBackfillResultDto } from '@pms/types';
import { Prisma } from '@prisma/client';

/**
 * Turns a saved business document into a journal voucher. Every method runs on the caller's
 * transaction client so the document and its voucher commit together, and every method is a
 * no-op when the store has no chart of accounts yet - a store that has not opted into
 * accounting must still be able to sell.
 */
export interface IAccountingPostingService {
  postSale(orderId: number, storeCode: string, createdById: string, transactionClient: Prisma.TransactionClient): Promise<number | null>;
  postReceipt(paymentId: number, storeCode: string, createdById: string, transactionClient: Prisma.TransactionClient): Promise<number | null>;
  postPurchase(purchaseId: number, storeCode: string, createdById: string, transactionClient: Prisma.TransactionClient): Promise<number | null>;
  postSalesReturn(returnId: number, storeCode: string, createdById: string, transactionClient: Prisma.TransactionClient): Promise<number | null>;
  isConfigured(storeCode: string, transactionClient: Prisma.TransactionClient): Promise<boolean>;
  backfill(data: AccountingBackfillModel, storeCode: string, userId: string): Promise<AccountingBackfillResultDto>;
}
