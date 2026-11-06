export type EstimateStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED' | 'CANCELLED';

export enum EstimateStatusEnum {
  Draft = 'DRAFT',
  Sent = 'SENT',
  Accepted = 'ACCEPTED',
  Rejected = 'REJECTED',
  Expired = 'EXPIRED',
  Converted = 'CONVERTED',
  Cancelled = 'CANCELLED',
}

/**
 * The only legal moves between estimate statuses. An empty list is a terminal state, and
 * EXPIRED is also applied lazily: an estimate past its validUntil refuses ACCEPTED/CONVERTED
 * regardless of this map until the validity is extended.
 */
export const ESTIMATE_STATUS_TRANSITIONS: Record<EstimateStatus, EstimateStatus[]> = {
  DRAFT: ['SENT', 'CANCELLED'],
  SENT: ['ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
  ACCEPTED: ['CONVERTED', 'CANCELLED'],
  REJECTED: [],
  EXPIRED: [],
  CONVERTED: [],
  CANCELLED: [],
};
