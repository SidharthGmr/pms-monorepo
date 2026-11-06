import { describe, expect, it } from 'vitest';
import { computeEstimateLine, computeEstimateTotals } from './estimate-totals';

// Every expected number is hand-computed, so a drift in the pipeline fails loudly.
// The API recomputes documents with these functions, so this is the money contract.
describe('computeEstimateTotals', () => {
  it('keeps inclusive (WithTax) GST inside the price: 2 x 500 @ 18%', () => {
    const totals = computeEstimateTotals([{ quantity: 2, unitPrice: 500, taxRate: 18, taxType: 'WithTax' }], {});
    expect(totals.subtotal).toBe(1000);
    expect(totals.taxAmount).toBe(152.54);
    expect(totals.taxableAmount).toBe(847.46);
    expect(totals.cgstAmount).toBe(76.27);
    expect(totals.sgstAmount).toBe(76.27);
    expect(totals.igstAmount).toBe(0);
    expect(totals.grandTotal).toBe(1000);
  });

  it('adds exclusive (WithoutTax) tax after the line discount: 1500 -10% +12%', () => {
    const totals = computeEstimateTotals(
      [{ quantity: 1, unitPrice: 1500, discountType: 'PERCENTAGE', discountValue: 10, taxRate: 12, taxType: 'WithoutTax' }],
      {}
    );
    expect(totals.itemDiscountTotal).toBe(150);
    expect(totals.taxableAmount).toBe(1350);
    expect(totals.taxAmount).toBe(162);
    expect(totals.grandTotal).toBe(1512);
  });

  it('clamps a flat line discount at the line amount', () => {
    const line = computeEstimateLine({ quantity: 1, unitPrice: 100, discountType: 'FLAT', discountValue: 200 });
    expect(line.discountAmount).toBe(100);
    expect(line.lineTotal).toBe(0);
  });

  it('applies additional % discount, shipping and a negative adjustment', () => {
    const totals = computeEstimateTotals(
      [
        { quantity: 1, unitPrice: 1000 },
        { quantity: 1, unitPrice: 500 },
      ],
      { additionalDiscountType: 'PERCENTAGE', additionalDiscountValue: 10, shippingCharges: 50, adjustment: -10 }
    );
    expect(totals.additionalDiscount).toBe(150);
    expect(totals.grandTotal).toBe(1390);
  });

  it('clamps an additional flat discount at the document total', () => {
    const totals = computeEstimateTotals([{ quantity: 1, unitPrice: 500 }], {
      additionalDiscountType: 'FLAT',
      additionalDiscountValue: 600,
      shippingCharges: 25,
    });
    expect(totals.additionalDiscount).toBe(500);
    expect(totals.grandTotal).toBe(25);
  });

  it('routes the whole tax to IGST on inter-state supplies', () => {
    const totals = computeEstimateTotals([{ quantity: 2, unitPrice: 500, taxRate: 18, taxType: 'WithTax' }], { isInterState: true });
    expect(totals.igstAmount).toBe(152.54);
    expect(totals.cgstAmount).toBe(0);
    expect(totals.sgstAmount).toBe(0);
  });

  it('reconstructs the tax exactly from CGST + SGST on odd paise', () => {
    const totals = computeEstimateTotals([{ quantity: 3, unitPrice: 33.33, taxRate: 18, taxType: 'WithTax' }], {});
    expect(totals.taxAmount).toBe(15.25);
    expect(Math.round((totals.cgstAmount + totals.sgstAmount) * 100) / 100).toBe(totals.taxAmount);
  });

  it('treats a zero rate (exempt/zero-rated/non-GST) as no tax at all', () => {
    const totals = computeEstimateTotals([{ quantity: 2, unitPrice: 250, taxRate: 0 }], {});
    expect(totals.taxAmount).toBe(0);
    expect(totals.taxableAmount).toBe(500);
    expect(totals.grandTotal).toBe(500);
  });
});
