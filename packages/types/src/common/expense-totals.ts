import { TaxType, TaxTypeEnum } from "../enum/tax.enum";

/**
 * One money pipeline for expenses, shared by the API (the authority - it recomputes and
 * overwrites whatever the client displayed) and the web form (live preview). `amount` is
 * what the user typed: WithTax means the GST is already inside it, WithoutTax means the GST
 * is added on top. CGST/SGST vs IGST is a presentation split of the same rate, chosen by
 * isInterState - the same convention the estimate pipeline uses, so a rent bill and a
 * quotation report GST identically.
 */

export interface ExpenseAmountInput {
  amount: number;
  taxRate?: number | null | undefined;
  taxType?: TaxType | null | undefined;
  isInterState?: boolean | undefined;
}

export interface ExpenseTotals {
  amount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  totalAmount: number;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

export function computeExpenseTotals(input: ExpenseAmountInput): ExpenseTotals {
  const amount = round2(Math.max(Number(input.amount) || 0, 0));
  const rate = Number(input.taxRate) || 0;

  let taxableAmount = amount;
  let taxAmount = 0;
  let totalAmount = amount;

  if (rate > 0) {
    if (input.taxType === TaxTypeEnum.WithoutTax) {
      taxAmount = round2((amount * rate) / 100);
      totalAmount = round2(amount + taxAmount);
    } else {
      taxAmount = round2((amount * rate) / (100 + rate));
      taxableAmount = round2(amount - taxAmount);
    }
  }

  const cgstAmount = input.isInterState ? 0 : round2(taxAmount / 2);
  const sgstAmount = input.isInterState ? 0 : round2(taxAmount - cgstAmount);
  const igstAmount = input.isInterState ? taxAmount : 0;

  return { amount, taxableAmount, cgstAmount, sgstAmount, igstAmount, taxAmount, totalAmount };
}
