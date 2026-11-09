import { AccountSystemKey } from './chart-of-accounts';
import { computeJournalTotals, round2 } from './journal-balance';

/**
 * How each business document turns into journal lines. These are pure functions so the
 * arithmetic can be unit-tested on its own: the posting service only resolves `account` keys
 * to ledger account ids and hands the result to the journal.
 *
 * Sale prices in this application are tax-inclusive (the POS convention), so an order's `tax`
 * is the GST portion already sitting inside `totalAmount` - revenue is the remainder, never
 * the gross. Every builder ends by forcing the two sides to agree: a sub-rupee residue goes to
 * Round Off rather than being left to fail the balance check.
 */

export interface PostingLineSpec {
  account: AccountSystemKey;
  debit: number;
  credit: number;
}

/** Which real-money account a payment method lands in. */
export type MoneyAccountKey = Extract<AccountSystemKey, 'CASH_IN_HAND' | 'BANK_ACCOUNT'>;

const line = (account: AccountSystemKey, debit: number, credit: number): PostingLineSpec => ({
  account,
  debit: round2(debit),
  credit: round2(credit),
});

/**
 * The largest gap Round Off is allowed to absorb. Rounding each side to paisa can leave a few
 * paisa; anything bigger is a document whose own totals do not add up, and quietly booking
 * that as income would hide the real problem - so it is raised instead.
 */
export const MAX_ROUNDING_PLUG = 1;

/** Drops zero-value lines, then adds a Round Off line if the two sides still disagree. */
const settle = (specs: PostingLineSpec[]): PostingLineSpec[] => {
  const kept = specs.filter((spec) => spec.debit > 0 || spec.credit > 0);
  const totals = computeJournalTotals(kept.map((spec) => ({ ledgerAccountId: 0, debit: spec.debit, credit: spec.credit })));
  if (totals.difference === 0) return kept;

  if (Math.abs(totals.difference) > MAX_ROUNDING_PLUG) {
    throw new Error(
      `Posting rule is out by ${totals.difference.toFixed(2)}, which is too much to treat as rounding ` +
        `(debits ${totals.totalDebit.toFixed(2)}, credits ${totals.totalCredit.toFixed(2)})`
    );
  }

  return totals.difference > 0
    ? [...kept, line('ROUND_OFF', 0, totals.difference)]
    : [...kept, line('ROUND_OFF', -totals.difference, 0)];
};

/** Splits a GST amount into the output accounts, so the parts always re-add to the whole. */
const outputTaxLines = (tax: number, isInterState: boolean): PostingLineSpec[] => {
  const total = round2(tax);
  if (total <= 0) return [];
  if (isInterState) return [line('IGST_OUTPUT', 0, total)];

  const cgst = round2(total / 2);
  return [line('CGST_OUTPUT', 0, cgst), line('SGST_OUTPUT', 0, round2(total - cgst))];
};

/** The same split on the debit side, for a return that gives the tax back. */
const reverseOutputTaxLines = (tax: number, isInterState: boolean): PostingLineSpec[] => {
  const total = round2(tax);
  if (total <= 0) return [];
  if (isInterState) return [line('IGST_OUTPUT', total, 0)];

  const cgst = round2(total / 2);
  return [line('CGST_OUTPUT', cgst, 0), line('SGST_OUTPUT', round2(total - cgst), 0)];
};

export interface SalePostingInput {
  totalAmount: number;
  tax: number;
  discount: number;
  shippingCost: number;
  grandTotal: number;
  isInterState?: boolean;
}

/**
 * A credit sale: the customer owes the grand total, revenue is recognised net of the GST
 * sitting inside the price, and an order-level discount is an expense rather than a reduction
 * of revenue so the gross stays visible. Cash actually received is a separate receipt voucher.
 */
export function buildSaleLines(input: SalePostingInput): PostingLineSpec[] {
  const tax = round2(input.tax);
  const netRevenue = round2(round2(input.totalAmount) - tax);

  return settle([
    line('ACCOUNTS_RECEIVABLE', input.grandTotal, 0),
    line('DISCOUNT_ALLOWED', input.discount, 0),
    line('SALES_REVENUE', 0, netRevenue),
    ...outputTaxLines(tax, input.isInterState === true),
    line('SHIPPING_INCOME', 0, input.shippingCost),
  ]);
}

export interface ReceiptPostingInput {
  amount: number;
  moneyAccount: MoneyAccountKey;
}

/** Money arriving against what a customer owes. */
export function buildReceiptLines(input: ReceiptPostingInput): PostingLineSpec[] {
  return settle([line(input.moneyAccount, input.amount, 0), line('ACCOUNTS_RECEIVABLE', 0, input.amount)]);
}

export interface PurchasePostingInput {
  totalAmount: number;
}

/**
 * Goods bought for resale under a periodic inventory system: the cost is an expense now and
 * the supplier is owed. Nothing touches the Inventory account, because no valuation method
 * has been chosen - see the note on INVENTORY in the chart of accounts.
 */
export function buildPurchaseLines(input: PurchasePostingInput): PostingLineSpec[] {
  return settle([line('PURCHASES', input.totalAmount, 0), line('ACCOUNTS_PAYABLE', 0, input.totalAmount)]);
}

export interface SalesReturnPostingInput {
  refundAmount: number;
  taxPortion: number;
  isInterState?: boolean;
  /** Where the money goes back from, or Accounts Receivable when it only cancels a debt. */
  refundTo: MoneyAccountKey | 'ACCOUNTS_RECEIVABLE';
}

/** Goods coming back: revenue and its GST are given up, and the refund leaves by one route. */
export function buildSalesReturnLines(input: SalesReturnPostingInput): PostingLineSpec[] {
  const taxPortion = round2(Math.min(Math.max(input.taxPortion, 0), input.refundAmount));
  const netRevenue = round2(round2(input.refundAmount) - taxPortion);

  return settle([
    line('SALES_REVENUE', netRevenue, 0),
    ...reverseOutputTaxLines(taxPortion, input.isInterState === true),
    line(input.refundTo, 0, input.refundAmount),
  ]);
}

/**
 * The GST sitting inside a partial refund, in the same proportion the original sale carried.
 * An order with no tax or no value returns zero rather than dividing by zero.
 */
export function proportionalTax(refundAmount: number, orderTax: number, orderGrandTotal: number): number {
  if (orderTax <= 0 || orderGrandTotal <= 0) return 0;
  return round2((round2(refundAmount) * round2(orderTax)) / round2(orderGrandTotal));
}

/**
 * Money vouchers name their accounts by id rather than by system key, because the user picks
 * which cash or bank account the money moved through and what it was for. The direction is
 * the part that is easy to get backwards, so it lives here with tests rather than in a
 * service: money arriving debits the cash account, money leaving credits it.
 */
export interface PostingLineByIdSpec {
  ledgerAccountId: number;
  debit: number;
  credit: number;
}

const lineById = (ledgerAccountId: number, debit: number, credit: number): PostingLineByIdSpec => ({
  ledgerAccountId,
  debit: round2(debit),
  credit: round2(credit),
});

export interface MoneyVoucherPostingInput {
  direction: 'IN' | 'OUT';
  /** The cash or bank account the money actually moved through. */
  moneyAccountId: number;
  /** What it was for: a receivable, a payable, income, an expense, capital. */
  counterAccountId: number;
  amount: number;
}

export function buildMoneyVoucherLines(input: MoneyVoucherPostingInput): PostingLineByIdSpec[] {
  const amount = round2(input.amount);
  if (amount <= 0) return [];
  if (input.moneyAccountId === input.counterAccountId) return [];

  return input.direction === 'IN'
    ? [lineById(input.moneyAccountId, amount, 0), lineById(input.counterAccountId, 0, amount)]
    : [lineById(input.counterAccountId, amount, 0), lineById(input.moneyAccountId, 0, amount)];
}

export interface TransferPostingInput {
  fromAccountId: number;
  toAccountId: number;
  amount: number;
}

/**
 * Moving the business's own money between its own accounts. Both sides are balance-sheet
 * accounts, so nothing here may ever touch income or expense - a transfer that shows up as
 * revenue is the classic way a cash book inflates turnover.
 */
export function buildTransferLines(input: TransferPostingInput): PostingLineByIdSpec[] {
  const amount = round2(input.amount);
  if (amount <= 0) return [];
  if (input.fromAccountId === input.toAccountId) return [];

  return [lineById(input.toAccountId, amount, 0), lineById(input.fromAccountId, 0, amount)];
}

export interface ExpensePostingInput {
  /** The expense ledger account the user picked - the category, straight off the chart. */
  expenseAccountId: number;
  taxableAmount: number;
  taxAmount: number;
  isInterState: boolean;
  cgstInputAccountId?: number | null | undefined;
  sgstInputAccountId?: number | null | undefined;
  igstInputAccountId?: number | null | undefined;
  /** Cash or bank when the expense is paid outright, Accounts Payable while it is still owed. */
  creditAccountId: number;
}

/**
 * Recognising a cost. The GST on a purchase is an asset - input credit the business can set
 * against the GST it collects - so it is debited to the input accounts rather than buried in
 * the expense. When the chart has no input account to put it in the tax becomes part of the
 * cost instead, which is the correct treatment for a credit that cannot be claimed, and keeps
 * the voucher balanced by construction rather than by a rounding plug.
 */
export function buildExpenseLines(input: ExpensePostingInput): PostingLineByIdSpec[] {
  const taxable = round2(Math.max(input.taxableAmount, 0));
  const tax = round2(Math.max(input.taxAmount, 0));
  if (taxable <= 0 && tax <= 0) return [];
  if (input.expenseAccountId === input.creditAccountId) return [];

  const taxLines: PostingLineByIdSpec[] = [];
  let unclaimableTax = 0;

  if (tax > 0) {
    if (input.isInterState) {
      if (input.igstInputAccountId) taxLines.push(lineById(input.igstInputAccountId, tax, 0));
      else unclaimableTax = tax;
    } else if (input.cgstInputAccountId && input.sgstInputAccountId) {
      const cgst = round2(tax / 2);
      taxLines.push(lineById(input.cgstInputAccountId, cgst, 0), lineById(input.sgstInputAccountId, round2(tax - cgst), 0));
    } else {
      unclaimableTax = tax;
    }
  }

  const expenseDebit = round2(taxable + unclaimableTax);
  const claimedTax = round2(taxLines.reduce((sum, taxLine) => sum + taxLine.debit, 0));
  const total = round2(expenseDebit + claimedTax);

  return [lineById(input.expenseAccountId, expenseDebit, 0), ...taxLines, lineById(input.creditAccountId, 0, total)];
}
