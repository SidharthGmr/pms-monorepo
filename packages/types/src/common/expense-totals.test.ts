import { describe, expect, it } from "vitest";
import { TaxTypeEnum } from "../enum/tax.enum";
import { computeExpenseTotals } from "./expense-totals";

describe("computeExpenseTotals", () => {
  it("treats a plain amount with no rate as fully taxable and untaxed", () => {
    const totals = computeExpenseTotals({ amount: 15000 });
    expect(totals).toMatchObject({ taxableAmount: 15000, taxAmount: 0, totalAmount: 15000 });
  });

  it("carves GST out of a tax-inclusive amount", () => {
    const totals = computeExpenseTotals({ amount: 11800, taxRate: 18, taxType: TaxTypeEnum.WithTax });
    expect(totals.taxAmount).toBe(1800);
    expect(totals.taxableAmount).toBe(10000);
    expect(totals.totalAmount).toBe(11800);
  });

  it("adds GST on top of a tax-exclusive amount", () => {
    const totals = computeExpenseTotals({ amount: 10000, taxRate: 18, taxType: TaxTypeEnum.WithoutTax });
    expect(totals.taxAmount).toBe(1800);
    expect(totals.taxableAmount).toBe(10000);
    expect(totals.totalAmount).toBe(11800);
  });

  it("splits GST in half for an intra-state expense and keeps the halves summing to the tax", () => {
    const totals = computeExpenseTotals({ amount: 1050, taxRate: 5, taxType: TaxTypeEnum.WithTax });
    expect(totals.cgstAmount + totals.sgstAmount).toBe(totals.taxAmount);
    expect(totals.igstAmount).toBe(0);
  });

  it("puts the whole GST in IGST for an inter-state expense", () => {
    const totals = computeExpenseTotals({ amount: 11800, taxRate: 18, taxType: TaxTypeEnum.WithTax, isInterState: true });
    expect(totals.igstAmount).toBe(1800);
    expect(totals.cgstAmount).toBe(0);
    expect(totals.sgstAmount).toBe(0);
  });

  it("never reports a negative amount", () => {
    expect(computeExpenseTotals({ amount: -500 }).amount).toBe(0);
  });

  it("defaults a rated expense with no tax type to inclusive, matching the sale convention", () => {
    const totals = computeExpenseTotals({ amount: 11800, taxRate: 18 });
    expect(totals.totalAmount).toBe(11800);
    expect(totals.taxAmount).toBe(1800);
  });
});
