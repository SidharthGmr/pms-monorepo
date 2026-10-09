import env from '../../config/env';
import { OrderDto } from '../../dtos/order.dto';
import logger from '../logger';
import { dispatchEmailAsync } from './emailDispatcher.util';

/**
 * Mails the store a copy of every order the moment it is placed. The recipient is the store's
 * own email, with ADMIN_NOTIFY_EMAIL as the fallback for stores that have none on file. Callers
 * fire this after the order's transaction has committed and never await the result - an SMTP
 * outage must cost the admin an email, not the customer a sale.
 */

const money = (value?: number | null) => `₹${Number(value ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Customer-typed values (names, notes) land inside the admin's inbox as HTML, so they are
// escaped here - renderTemplate itself does plain string replacement.
const esc = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const adjustmentRow = (label: string, value: string, colour = '#334155') =>
  `<tr><td style="padding:3px 0;color:${colour};">${label}</td><td align="right" style="padding:3px 0;font-weight:bold;color:${colour};">${value}</td></tr>`;

export const notifyAdminOfNewOrder = async (
  order: OrderDto & { store?: { name?: string | null; email?: string | null } | null; customer?: { name?: string | null; firstName?: string | null; lastName?: string | null; email?: string | null; phone?: string | null } | null; items?: any[] },
  fallbackRecipient?: string
): Promise<void> => {
  try {
    const to = order.store?.email || fallbackRecipient || env.ADMIN_NOTIFY_EMAIL;
    if (!to) {
      logger.warn('order notification skipped - no store email, no admin user email and ADMIN_NOTIFY_EMAIL is not set', { orderNumber: order.orderNumber });
      return;
    }

    const customer = order.customer;
    const customerName = customer?.name || [customer?.firstName, customer?.lastName].filter(Boolean).join(' ') || 'Walk-in customer';
    const customerContact = [customer?.email, customer?.phone].filter(Boolean).join(' · ') || 'No contact details on file';
    const storeName = order.store?.name || env.APP_NAME;

    const items = order.items ?? [];
    const itemsRows =
      items
        .map((item: any) => {
          const name = item.product?.name ?? `Product #${item.productId}`;
          const sku = item.variant?.sku ? ` <span style="font-family:Consolas,Menlo,monospace;color:#94a3b8;font-size:11px;">${esc(item.variant.sku)}</span>` : '';
          const amount = item.totalPrice ?? (item.unitPrice ?? 0) * (item.quantity ?? 1);
          return `<tr>
            <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;font-weight:bold;">${esc(name)}${sku}<br /><span style="font-weight:normal;font-size:11px;color:#64748b;">${money(item.unitPrice)} each</span></td>
            <td align="center" style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#334155;">${Number(item.quantity ?? 0)}</td>
            <td align="right" style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;font-weight:bold;">${money(amount)}</td>
          </tr>`;
        })
        .join('') || '<tr><td colspan="3" style="padding:12px 0;font-size:13px;color:#94a3b8;font-style:italic;">No items recorded on this order.</td></tr>';

    const adjustments = [
      order.discount > 0 ? adjustmentRow('Discount', `-${money(order.discount)}`, '#e11d48') : '',
      order.tax > 0 ? adjustmentRow('Tax', money(order.tax)) : '',
      order.shippingCost > 0 ? adjustmentRow('Shipping & fees', money(order.shippingCost)) : '',
    ].join('');

    const notesBlock = order.notes
      ? `<tr><td style="padding:16px 32px 0 32px;"><p style="margin:0;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;font-weight:bold;">Notes</p><p style="margin:4px 0 0 0;font-size:12px;color:#64748b;">${esc(order.notes)}</p></td></tr>`
      : '';

    const totalQuantity = items.reduce((sum: number, item: any) => sum + Number(item.quantity ?? 0), 0);
    const placedAt = order.createdAt
      ? new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })
      : '—';

    await dispatchEmailAsync({
      to,
      subject: `New order ${order.orderNumber} · ${money(order.grandTotal)} · ${customerName}`,
      templateName: 'order-placed',
      templateData: {
        appName: env.APP_NAME,
        storeName: esc(storeName),
        orderNumber: esc(order.orderNumber),
        placedAt,
        status: esc(order.status),
        customerName: esc(customerName),
        customerContact: esc(customerContact),
        itemsRows,
        adjustmentRows: adjustments,
        notesBlock,
        subtotal: money(order.totalAmount),
        grandTotal: money(order.grandTotal),
        itemsSummary: `${items.length} item${items.length === 1 ? '' : 's'} · ${totalQuantity} qty`,
        orderUrl: `${env.APP_PUBLIC_URL || ''}/admin/orders/${order.id}`,
      },
    });

    logger.info('order notification sent', { orderNumber: order.orderNumber, to });
  } catch (error) {
    logger.error('order notification failed', { orderNumber: order.orderNumber, error: (error as Error)?.message });
  }
};
