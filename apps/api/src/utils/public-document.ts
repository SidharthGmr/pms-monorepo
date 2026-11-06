import { EstimateDto, OrderDto, PublicDocumentDto } from '@pms/types';

/**
 * Narrows a full document down to what its recipient may see. Everything internal - database
 * ids, storeCode, customer id, who created it, the status history - is dropped here rather
 * than at the edge, so a new field on the admin DTO can never leak through the public link.
 */

const storeOf = (store: EstimateDto['store'] | OrderDto['store']) => ({
  name: (store as { siteName?: string | null })?.siteName || store?.name?.split(' - ')[0] || 'Store',
  logoUrl: (store as { storeLogo?: string | null })?.storeLogo ?? null,
  address: store?.address ?? null,
  phone: store?.phone ?? null,
  email: store?.email ?? null,
});

export function toPublicEstimate(estimate: EstimateDto): PublicDocumentDto {
  const expired =
    estimate.validUntil != null &&
    new Date(estimate.validUntil).getTime() < Date.now() &&
    (estimate.status === 'DRAFT' || estimate.status === 'SENT');

  return {
    kind: 'ESTIMATE',
    number: estimate.estimateNumber,
    status: expired ? 'EXPIRED' : estimate.status,
    issuedAt: estimate.estimateDate,
    validUntil: estimate.validUntil ?? null,
    isExpired: expired,
    referenceNumber: estimate.referenceNumber ?? null,
    customerName: estimate.customerName,
    billingAddress: estimate.billingAddress ?? null,
    shippingAddress: estimate.shippingAddress ?? null,
    notes: estimate.notes ?? null,
    terms: estimate.terms ?? null,
    isInterState: estimate.isInterState,
    store: storeOf(estimate.store),
    items: (estimate.items ?? []).map((item) => ({
      name: item.productName,
      variantName: item.variantName && item.variantName !== item.productName ? item.variantName.replace(`${item.productName} - `, '') : null,
      sku: item.sku ?? null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountAmount: item.discountAmount,
      taxAmount: item.taxAmount,
      taxLabel: item.taxAmount > 0 ? `${item.taxName || 'GST'}@${item.taxRate}%` : null,
      lineTotal: item.lineTotal,
    })),
    totals: {
      subtotal: estimate.subtotal,
      itemDiscountTotal: estimate.itemDiscountTotal,
      additionalDiscount: estimate.additionalDiscount,
      taxableAmount: estimate.taxableAmount,
      cgstAmount: estimate.cgstAmount,
      sgstAmount: estimate.sgstAmount,
      igstAmount: estimate.igstAmount,
      taxAmount: estimate.taxAmount,
      shippingCharges: estimate.shippingCharges,
      adjustment: estimate.adjustment,
      grandTotal: estimate.grandTotal,
    },
  };
}

export function toPublicOrder(order: OrderDto): PublicDocumentDto {
  // An order carries one tax-inclusive GST figure and no per-line discount or CGST/SGST
  // split, so those stay zero here rather than being invented for the layout's sake.
  const round2 = (value: number) => Math.round(value * 100) / 100;

  return {
    kind: 'ORDER',
    number: order.orderNumber,
    status: order.status,
    issuedAt: order.orderDate ?? order.createdAt,
    customerName: order.customer?.name || [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(' ') || 'Customer',
    notes: order.notes ?? null,
    store: storeOf(order.store),
    items: (order.items ?? []).map((item) => ({
      name: item.product?.name ?? 'Product',
      variantName: item.variant?.name && item.variant.name !== item.product?.name ? item.variant.name.replace(`${item.product?.name} - `, '') : null,
      sku: item.variant?.sku ?? null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountAmount: 0,
      taxAmount: 0,
      taxLabel: null,
      lineTotal: item.totalPrice ?? round2(item.unitPrice * item.quantity),
    })),
    totals: {
      subtotal: order.totalAmount,
      itemDiscountTotal: 0,
      additionalDiscount: order.discount,
      taxableAmount: round2(order.totalAmount - order.tax),
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      taxAmount: order.tax,
      shippingCharges: order.shippingCost,
      adjustment: 0,
      grandTotal: order.grandTotal,
    },
  };
}
