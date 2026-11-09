import { VoucherType } from '../enum/voucher-type.enum';

/**
 * The totals shown above the Day Book.
 *
 * `totalDebit`/`totalCredit` are journal movement: for a balanced set of vouchers they are
 * equal by construction, so they say how much was recorded, never how much money came in.
 * Cash flow is `cashIn`/`cashOut`, taken only from lines against cash and bank accounts.
 * Keeping the two apart is the whole point - reading journal movement as cash is the classic
 * way a day book lies.
 */
export interface DayBookDayTotalDto {
  /** ISO date (yyyy-mm-dd) in the store's own reckoning of the day. */
  date: string;
  totalDebit: number;
  totalCredit: number;
  voucherCount: number;
}

export interface DayBookVoucherTypeTotalDto {
  voucherType: VoucherType;
  totalDebit: number;
  totalCredit: number;
  voucherCount: number;
}

export interface DayBookSummaryDto {
  totalDebit: number;
  totalCredit: number;
  voucherCount: number;
  cashIn: number;
  cashOut: number;
  /** cashIn - cashOut over the range, which is the only figure that is real movement. */
  netCashMovement: number;
  byDay: DayBookDayTotalDto[];
  byVoucherType: DayBookVoucherTypeTotalDto[];
}
