import { describe, expect, it } from 'vitest';
import {
  buildExpenseLines,
  buildMoneyVoucherLines,
  buildPurchaseLines,
  buildReceiptLines,
  buildSaleLines,
  buildSalesReturnLines,
  buildTransferLines,
  PostingLineByIdSpec,
  proportionalTax,
} from './posting-rules';
import { computeJournalTotals, round2, validateJournalLines } from './journal-balance';

// Every expected number is hand-computed. These builders decide what the books say about a
// sale, so a drift here silently misstates revenue or GST.
const asLines = (specs: { debit: number; credit: number }[]) => specs.map((spec) => ({ ledgerAccountId: 1, debit: spec.debit, credit: spec.credit }));
const amountOn = (specs: { account: string; debit: number; credit: number }[], account: string) =>
  specs.filter((spec) => spec.account === account).reduce((sum, spec) => sum + spec.debit + spec.credit, 0);

describe('buildSaleLines', () => {
  it('recognises revenue net of the GST already inside the price', () => {
    const lines = buildSaleLines({ totalAmount: 1180, tax: 180, discount: 0, shippingCost: 0, grandTotal: 1180 });
    expect(amountOn(lines, 'ACCOUNTS_RECEIVABLE')).toBe(1180);
    expect(amountOn(lines, 'SALES_REVENUE')).toBe(1000);
    expect(amountOn(lines, 'CGST_OUTPUT')).toBe(90);
    expect(amountOn(lines, 'SGST_OUTPUT')).toBe(90);
    expect(computeJournalTotals(asLines(lines)).isBalanced).toBe(true);
  });

  it('balances a sale carrying a discount and shipping', () => {
    const lines = buildSaleLines({ totalAmount: 1000, tax: 0, discount: 100, shippingCost: 50, grandTotal: 950 });
    expect(amountOn(lines, 'ACCOUNTS_RECEIVABLE')).toBe(950);
    expect(amountOn(lines, 'DISCOUNT_ALLOWED')).toBe(100);
    expect(amountOn(lines, 'SALES_REVENUE')).toBe(1000);
    expect(amountOn(lines, 'SHIPPING_INCOME')).toBe(50);
    expect(computeJournalTotals(asLines(lines)).isBalanced).toBe(true);
  });

  it('uses IGST instead of the CGST/SGST pair when inter-state', () => {
    const lines = buildSaleLines({ totalAmount: 1180, tax: 180, discount: 0, shippingCost: 0, grandTotal: 1180, isInterState: true });
    expect(amountOn(lines, 'IGST_OUTPUT')).toBe(180);
    expect(amountOn(lines, 'CGST_OUTPUT')).toBe(0);
    expect(amountOn(lines, 'SGST_OUTPUT')).toBe(0);
    expect(computeJournalTotals(asLines(lines)).isBalanced).toBe(true);
  });

  it('splits an odd tax so the halves still re-add to the whole', () => {
    const lines = buildSaleLines({ totalAmount: 1000.01, tax: 15.25, discount: 0, shippingCost: 0, grandTotal: 1000.01 });
    expect(amountOn(lines, 'CGST_OUTPUT') + amountOn(lines, 'SGST_OUTPUT')).toBe(15.25);
    expect(computeJournalTotals(asLines(lines)).isBalanced).toBe(true);
  });

  it('absorbs a grand total that does not match its parts into Round Off', () => {
    const lines = buildSaleLines({ totalAmount: 1000, tax: 0, discount: 0, shippingCost: 0, grandTotal: 999.99 });
    expect(amountOn(lines, 'ROUND_OFF')).toBe(0.01);
    expect(computeJournalTotals(asLines(lines)).isBalanced).toBe(true);
  });

  it('refuses to bury a real discrepancy in Round Off', () => {
    expect(() => buildSaleLines({ totalAmount: 1000, tax: 0, discount: 0, shippingCost: 0, grandTotal: 400 })).toThrow(/too much to treat as rounding/);
  });

  it('still plugs a gap right at the one-rupee limit', () => {
    const lines = buildSaleLines({ totalAmount: 1000, tax: 0, discount: 0, shippingCost: 0, grandTotal: 999 });
    expect(amountOn(lines, 'ROUND_OFF')).toBe(1);
    expect(computeJournalTotals(asLines(lines)).isBalanced).toBe(true);
  });

  it('drops the zero lines so a plain sale posts only two', () => {
    const lines = buildSaleLines({ totalAmount: 500, tax: 0, discount: 0, shippingCost: 0, grandTotal: 500 });
    expect(lines).toHaveLength(2);
    expect(validateJournalLines(asLines(lines))).toEqual([]);
  });
});

describe('buildReceiptLines', () => {
  it('moves money in against the receivable', () => {
    const lines = buildReceiptLines({ amount: 1180, moneyAccount: 'CASH_IN_HAND' });
    expect(amountOn(lines, 'CASH_IN_HAND')).toBe(1180);
    expect(amountOn(lines, 'ACCOUNTS_RECEIVABLE')).toBe(1180);
    expect(computeJournalTotals(asLines(lines)).isBalanced).toBe(true);
  });

  it('sends a card or online payment to the bank account', () => {
    const lines = buildReceiptLines({ amount: 2500, moneyAccount: 'BANK_ACCOUNT' });
    expect(amountOn(lines, 'BANK_ACCOUNT')).toBe(2500);
    expect(computeJournalTotals(asLines(lines)).isBalanced).toBe(true);
  });
});

describe('buildPurchaseLines', () => {
  it('expenses the cost and owes the supplier, leaving Inventory untouched', () => {
    const lines = buildPurchaseLines({ totalAmount: 7400 });
    expect(amountOn(lines, 'PURCHASES')).toBe(7400);
    expect(amountOn(lines, 'ACCOUNTS_PAYABLE')).toBe(7400);
    expect(amountOn(lines, 'INVENTORY')).toBe(0);
    expect(amountOn(lines, 'COST_OF_GOODS_SOLD')).toBe(0);
    expect(computeJournalTotals(asLines(lines)).isBalanced).toBe(true);
  });
});

describe('buildSalesReturnLines', () => {
  it('gives back revenue and its GST, paying out in cash', () => {
    const lines = buildSalesReturnLines({ refundAmount: 1180, taxPortion: 180, refundTo: 'CASH_IN_HAND' });
    expect(amountOn(lines, 'SALES_REVENUE')).toBe(1000);
    expect(amountOn(lines, 'CGST_OUTPUT') + amountOn(lines, 'SGST_OUTPUT')).toBe(180);
    expect(amountOn(lines, 'CASH_IN_HAND')).toBe(1180);
    expect(computeJournalTotals(asLines(lines)).isBalanced).toBe(true);
  });

  it('cancels a debt instead of paying out when there is no refund method', () => {
    const lines = buildSalesReturnLines({ refundAmount: 500, taxPortion: 0, refundTo: 'ACCOUNTS_RECEIVABLE' });
    expect(amountOn(lines, 'ACCOUNTS_RECEIVABLE')).toBe(500);
    expect(amountOn(lines, 'SALES_REVENUE')).toBe(500);
    expect(computeJournalTotals(asLines(lines)).isBalanced).toBe(true);
  });

  it('never lets the tax portion exceed the refund', () => {
    const lines = buildSalesReturnLines({ refundAmount: 100, taxPortion: 250, refundTo: 'CASH_IN_HAND' });
    expect(amountOn(lines, 'SALES_REVENUE')).toBe(0);
    expect(computeJournalTotals(asLines(lines)).isBalanced).toBe(true);
  });
});

describe('proportionalTax', () => {
  it('takes the same share of tax the original sale carried', () => {
    expect(proportionalTax(590, 180, 1180)).toBe(90);
  });

  it('is zero for an untaxed order', () => {
    expect(proportionalTax(500, 0, 1000)).toBe(0);
  });

  it('does not divide by zero on a zero-value order', () => {
    expect(proportionalTax(100, 50, 0)).toBe(0);
  });

  it('returns the whole tax when the whole order comes back', () => {
    expect(proportionalTax(1180, 180, 1180)).toBe(180);
  });
});

describe('buildMoneyVoucherLines', () => {
  it('debits the cash account when money arrives', () => {
    const lines = buildMoneyVoucherLines({ direction: 'IN', moneyAccountId: 10, counterAccountId: 20, amount: 500 });
    expect(lines).toEqual([
      { ledgerAccountId: 10, debit: 500, credit: 0 },
      { ledgerAccountId: 20, debit: 0, credit: 500 },
    ]);
  });

  it('credits the cash account when money leaves', () => {
    const lines = buildMoneyVoucherLines({ direction: 'OUT', moneyAccountId: 10, counterAccountId: 20, amount: 500 });
    expect(lines).toEqual([
      { ledgerAccountId: 20, debit: 500, credit: 0 },
      { ledgerAccountId: 10, debit: 0, credit: 500 },
    ]);
  });

  it('refuses a voucher that moves nothing or points at one account', () => {
    expect(buildMoneyVoucherLines({ direction: 'IN', moneyAccountId: 10, counterAccountId: 20, amount: 0 })).toEqual([]);
    expect(buildMoneyVoucherLines({ direction: 'IN', moneyAccountId: 10, counterAccountId: 10, amount: 500 })).toEqual([]);
  });
});

describe('buildTransferLines', () => {
  it('moves money between two of the business own accounts', () => {
    const lines = buildTransferLines({ fromAccountId: 10, toAccountId: 11, amount: 2000 });
    expect(lines).toEqual([
      { ledgerAccountId: 11, debit: 2000, credit: 0 },
      { ledgerAccountId: 10, debit: 0, credit: 2000 },
    ]);
    const totals = computeJournalTotals(lines);
    expect(totals.isBalanced).toBe(true);
  });

  it('never touches a third account, so a transfer cannot become income', () => {
    const lines = buildTransferLines({ fromAccountId: 10, toAccountId: 11, amount: 2000 });
    expect(new Set(lines.map((l) => l.ledgerAccountId))).toEqual(new Set([10, 11]));
  });

  it('refuses a transfer to the same account', () => {
    expect(buildTransferLines({ fromAccountId: 10, toAccountId: 10, amount: 2000 })).toEqual([]);
  });
});

describe('buildPurchaseLines', () => {
  it('books the whole bill to purchases when no GST is identified', () => {
    const lines = buildPurchaseLines({ totalAmount: 5000 });
    expect(lines).toEqual([
      { account: 'PURCHASES', debit: 5000, credit: 0 },
      { account: 'ACCOUNTS_PAYABLE', debit: 0, credit: 5000 },
    ]);
  });

  it('splits the GST inside the bill into the input accounts, never on top of it', () => {
    const lines = buildPurchaseLines({ totalAmount: 11800, tax: 1800 });
    expect(lines.find((l) => l.account === 'PURCHASES')?.debit).toBe(10000);
    expect(lines.find((l) => l.account === 'CGST_INPUT')?.debit).toBe(900);
    expect(lines.find((l) => l.account === 'SGST_INPUT')?.debit).toBe(900);
    expect(lines.find((l) => l.account === 'ACCOUNTS_PAYABLE')?.credit).toBe(11800);
    const totals = computeJournalTotals(lines.map((l) => ({ ledgerAccountId: 0, debit: l.debit, credit: l.credit })));
    expect(totals.difference).toBe(0);
  });

  it('uses IGST input for an inter-state supplier', () => {
    const lines = buildPurchaseLines({ totalAmount: 11800, tax: 1800, isInterState: true });
    expect(lines.find((l) => l.account === 'IGST_INPUT')?.debit).toBe(1800);
    expect(lines.some((l) => l.account === 'CGST_INPUT')).toBe(false);
  });

  it('caps the tax at the bill total rather than going negative', () => {
    const lines = buildPurchaseLines({ totalAmount: 100, tax: 500 });
    expect(lines.find((l) => l.account === 'PURCHASES')).toBeUndefined();
    expect(lines.find((l) => l.account === 'ACCOUNTS_PAYABLE')?.credit).toBe(100);
  });
});

describe('buildExpenseLines', () => {
  const sum = (lines: PostingLineByIdSpec[], side: 'debit' | 'credit') => round2(lines.reduce((total, line) => total + line[side], 0));

  it('debits the expense and credits cash for a paid expense with no GST', () => {
    const lines = buildExpenseLines({ expenseAccountId: 55, taxableAmount: 15000, taxAmount: 0, isInterState: false, creditAccountId: 11 });
    expect(lines).toEqual([
      { ledgerAccountId: 55, debit: 15000, credit: 0 },
      { ledgerAccountId: 11, debit: 0, credit: 15000 },
    ]);
  });

  it('debits GST to the input accounts rather than into the expense', () => {
    const lines = buildExpenseLines({
      expenseAccountId: 55,
      taxableAmount: 10000,
      taxAmount: 1800,
      isInterState: false,
      cgstInputAccountId: 16,
      sgstInputAccountId: 17,
      creditAccountId: 11,
    });
    expect(lines.find((line) => line.ledgerAccountId === 55)?.debit).toBe(10000);
    expect(lines.find((line) => line.ledgerAccountId === 16)?.debit).toBe(900);
    expect(lines.find((line) => line.ledgerAccountId === 17)?.debit).toBe(900);
    expect(lines.find((line) => line.ledgerAccountId === 11)?.credit).toBe(11800);
    expect(sum(lines, 'debit')).toBe(sum(lines, 'credit'));
  });

  it('uses the IGST input account for an inter-state bill', () => {
    const lines = buildExpenseLines({
      expenseAccountId: 55,
      taxableAmount: 10000,
      taxAmount: 1800,
      isInterState: true,
      igstInputAccountId: 18,
      cgstInputAccountId: 16,
      sgstInputAccountId: 17,
      creditAccountId: 11,
    });
    expect(lines.find((line) => line.ledgerAccountId === 18)?.debit).toBe(1800);
    expect(lines.some((line) => line.ledgerAccountId === 16)).toBe(false);
    expect(sum(lines, 'debit')).toBe(sum(lines, 'credit'));
  });

  it('absorbs the GST into the cost when the chart has no input account for it', () => {
    const lines = buildExpenseLines({ expenseAccountId: 55, taxableAmount: 10000, taxAmount: 1800, isInterState: false, creditAccountId: 11 });
    expect(lines.find((line) => line.ledgerAccountId === 55)?.debit).toBe(11800);
    expect(sum(lines, 'debit')).toBe(sum(lines, 'credit'));
  });

  it('keeps an odd GST split adding back to the whole', () => {
    const lines = buildExpenseLines({
      expenseAccountId: 55,
      taxableAmount: 100,
      taxAmount: 5.01,
      isInterState: false,
      cgstInputAccountId: 16,
      sgstInputAccountId: 17,
      creditAccountId: 11,
    });
    expect(sum(lines, 'debit')).toBe(sum(lines, 'credit'));
    expect(round2((lines.find((l) => l.ledgerAccountId === 16)?.debit ?? 0) + (lines.find((l) => l.ledgerAccountId === 17)?.debit ?? 0))).toBe(5.01);
  });

  it('refuses to post an expense against itself', () => {
    expect(buildExpenseLines({ expenseAccountId: 55, taxableAmount: 100, taxAmount: 0, isInterState: false, creditAccountId: 55 })).toEqual([]);
  });
});
