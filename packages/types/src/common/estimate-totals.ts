import { DiscountType, DiscountTypeEnum } from '../enum/discount.enum';
import { TaxType, TaxTypeEnum } from '../enum/tax.enum';

/**
 * One money pipeline for estimates, shared by the API (the authority - it recomputes and
 * overwrites whatever the client displayed) and the web form (live preview). Per line:
 * gross = unitPrice x qty; the line discount comes off the gross; tax applies to the
 * discounted amount - WithTax means the rate is already inside the price (the POS
 * convention), WithoutTax adds it on top. The additional discount applies to the sum of
 * line totals, then shipping and adjustment land on the grand total. CGST/SGST vs IGST is
 * a presentation split of the same snapshot rate, chosen by isInterState.
 */

export interface EstimateLineInput {
  quantity: number;
  unitPrice: number;
  discountType?: DiscountType | null;
  discountValue?: number | null;
  taxRate?: number | null;
  taxType?: TaxType | null;
}

export interface EstimateLineTotals {
  grossAmount: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  lineTotal: number;
}

export interface EstimateChargesInput {
  additionalDiscountType?: DiscountType | null | undefined;
  additionalDiscountValue?: number | null | undefined;
  shippingCharges?: number | null | undefined;
  adjustment?: number | null | undefined;
  isInterState?: boolean | undefined;
}

export interface EstimateTotals {
  lines: EstimateLineTotals[];
  subtotal: number;
  itemDiscountTotal: number;
  additionalDiscount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  shippingCharges: number;
  adjustment: number;
  grandTotal: number;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

export function computeEstimateLine(line: EstimateLineInput): EstimateLineTotals {
  const quantity = Number(line.quantity) || 0;
  const unitPrice = Number(line.unitPrice) || 0;
  const grossAmount = round2(unitPrice * quantity);

  const rawDiscount =
    line.discountValue == null || line.discountValue <= 0
      ? 0
      : line.discountType === DiscountTypeEnum.Percentage
        ? (grossAmount * line.discountValue) / 100
        : line.discountValue;
  const discountAmount = round2(Math.min(Math.max(rawDiscount, 0), grossAmount));

  const net = round2(grossAmount - discountAmount);
  const rate = Number(line.taxRate) || 0;

  if (rate <= 0) {
    return { grossAmount, discountAmount, taxableAmount: net, taxAmount: 0, lineTotal: net };
  }
  if (line.taxType === TaxTypeEnum.WithoutTax) {
    const taxAmount = round2((net * rate) / 100);
    return { grossAmount, discountAmount, taxableAmount: net, taxAmount, lineTotal: round2(net + taxAmount) };
  }
  const taxAmount = round2((net * rate) / (100 + rate));
  return { grossAmount, discountAmount, taxableAmount: round2(net - taxAmount), taxAmount, lineTotal: net };
}

export function computeEstimateTotals(items: EstimateLineInput[], charges: EstimateChargesInput = {}): EstimateTotals {
  const lines = items.map(computeEstimateLine);

  const subtotal = round2(lines.reduce((sum, line) => sum + line.grossAmount, 0));
  const itemDiscountTotal = round2(lines.reduce((sum, line) => sum + line.discountAmount, 0));
  const taxableAmount = round2(lines.reduce((sum, line) => sum + line.taxableAmount, 0));
  const taxAmount = round2(lines.reduce((sum, line) => sum + line.taxAmount, 0));
  const lineTotalSum = round2(lines.reduce((sum, line) => sum + line.lineTotal, 0));

  const rawAdditional =
    charges.additionalDiscountValue == null || charges.additionalDiscountValue <= 0
      ? 0
      : charges.additionalDiscountType === DiscountTypeEnum.Flat
        ? charges.additionalDiscountValue
        : (lineTotalSum * charges.additionalDiscountValue) / 100;
  const additionalDiscount = round2(Math.min(Math.max(rawAdditional, 0), lineTotalSum));

  const cgstAmount = charges.isInterState ? 0 : round2(taxAmount / 2);
  const sgstAmount = charges.isInterState ? 0 : round2(taxAmount - cgstAmount);
  const igstAmount = charges.isInterState ? taxAmount : 0;

  const shippingCharges = round2(Math.max(Number(charges.shippingCharges) || 0, 0));
  const adjustment = round2(Number(charges.adjustment) || 0);
  const grandTotal = round2(lineTotalSum - additionalDiscount + shippingCharges + adjustment);

  return {
    lines,
    subtotal,
    itemDiscountTotal,
    additionalDiscount,
    taxableAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    taxAmount,
    shippingCharges,
    adjustment,
    grandTotal,
  };
}
