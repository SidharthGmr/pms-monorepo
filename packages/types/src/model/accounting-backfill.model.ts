export type PostingSourceType = 'order' | 'payment' | 'purchase' | 'orderReturn';

export enum PostingSourceTypeEnum {
  Order = 'order',
  Payment = 'payment',
  Purchase = 'purchase',
  OrderReturn = 'orderReturn',
}

export const POSTING_SOURCE_LABELS: Record<PostingSourceType, string> = {
  order: 'Sales',
  payment: 'Receipts',
  purchase: 'Purchases',
  orderReturn: 'Sales Returns',
};

/**
 * One batch of historical documents to post. The caller walks forward by passing the previous
 * response's `lastId` back as `afterId`, because each document is posted in its own small
 * transaction - a single transaction over a whole history would exceed the database timeout
 * and roll the entire backfill back.
 */
export interface AccountingBackfillModel {
  sourceType: PostingSourceType;
  afterId?: number;
  limit?: number;
}

export interface AccountingBackfillResultDto {
  sourceType: PostingSourceType;
  scanned: number;
  posted: number;
  skipped: number;
  failed: number;
  /** Highest document id looked at, to pass back as `afterId` for the next batch. */
  lastId: number | null;
  hasMore: boolean;
  /** Why a document could not be posted, for the few that fail. */
  errors: { id: number; message: string }[];
}
