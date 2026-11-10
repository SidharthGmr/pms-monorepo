import { SampleInvoice } from '@/components/features/settings/invoice-templates/sample-data';
import { OrderDto, PaymentStatusEnum } from '@pms/types';

/**
 * A saved order as the Tax Invoice template's data shape, so the bill a customer receives is
 * the same GST-compliant layout the settings gallery previews - seller and buyer GSTIN, HSN
 * per line, the CGST/SGST-or-IGST split. The template's status union is narrower than an
 * order's, so the in-flight states collapse onto CONFIRMED and a return reads as CANCELLED.
 */
const TEMPLATE_STATUS: Record<string, SampleInvoice['status']> = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  SHIPPED: 'CONFIRMED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  RETURNED: 'CANCELLED',
};

export function orderToTaxInvoice(order: OrderDto): SampleInvoice {
  const payments = order.payments ?? [];
  const received = payments
    .filter((payment) => payment.status === PaymentStatusEnum.Paid)
    .reduce((sum, payment) => sum + (payment.amount ?? 0), 0);
  const latestPayment = payments[0];

  return {
    number: order.orderNumber,
    status: TEMPLATE_STATUS[order.status] ?? 'CONFIRMED',
    issuedAt: new Date(order.orderDate),
    store: {
      name: order.store?.siteName || order.store?.name || '',
      code: order.store?.code ?? '',
      address: order.store?.address ?? '',
      phone: order.store?.phone ?? '',
      email: order.store?.email ?? '',
      gstin: order.store?.gstin ?? undefined,
    },
    customer: {
      name: order.customer?.name ?? 'Walk-in customer',
      address: '',
      phone: order.customer?.phone ?? '',
      email: order.customer?.email ?? '',
      gstin: order.customer?.gstin ?? undefined,
    },
    isInterState: order.isInterState === true,
    items: (order.items ?? []).map((item) => ({
      name: item.product?.name ?? `Product #${item.productId}`,
      variant: item.variant?.name ?? undefined,
      sku: item.variant?.sku ?? undefined,
      hsn: item.product?.hsnCode ?? undefined,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      tax: item.taxAmount || undefined,
    })),
    discount: order.discount,
    // Prices are GST-inclusive, so the exact tax is shown, never added to the total.
    taxRate: 0,
    taxAmount: order.tax,
    taxIncluded: true,
    shipping: order.shippingCost,
    received: Math.round(received * 100) / 100,
    payment: { method: latestPayment?.method ?? '—', status: latestPayment ? latestPayment.status : 'Pending' },
    notes: order.notes ?? '',
  };
}
