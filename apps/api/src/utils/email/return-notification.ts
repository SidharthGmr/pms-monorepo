import env from '../../config/env';
import logger from '../logger';
import { dispatchEmailAsync } from './emailDispatcher.util';
import { OrderReturnDto, ReturnStatus, ReturnStatusEnum, ReturnTypeEnum } from '@pms/types';

/**
 * The two emails a return sends: one to the store when a request is raised, one to the customer
 * each time it moves. Both are fired after the transaction has committed and are never awaited -
 * an SMTP outage must cost an email, not the return itself.
 */

const money = (value?: number | null) => `₹${Number(value ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Customer-typed values (names, reasons, notes) land inside an inbox as HTML, so they are
// escaped here - renderTemplate itself does plain string replacement.
const esc = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const when = (value?: Date | string | null) =>
  value
    ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })
    : '—';

const itemRows = (orderReturn: OrderReturnDto): string =>
  (orderReturn.items ?? [])
    .map((item) => {
      const name = item.variant?.name || item.product?.name || `Variant #${item.variantId}`;
      const sku = item.variant?.sku ? ` <span style="font-family:Consolas,Menlo,monospace;color:#94a3b8;font-size:11px;">${esc(item.variant.sku)}</span>` : '';
      const condition =
        item.condition === 'DAMAGED'
          ? '<span style="font-size:11px;color:#be123c;font-weight:700;">Damaged</span>'
          : '<span style="font-size:11px;color:#64748b;">Sellable</span>';
      return `<tr>
        <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;font-weight:bold;">${esc(name)}${sku}<br />${condition}</td>
        <td align="center" style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#334155;">${Number(item.quantity ?? 0)}</td>
        <td align="right" style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;font-weight:bold;">${money(item.amount)}</td>
      </tr>`;
    })
    .join('') || '<tr><td colspan="3" style="padding:12px 0;font-size:13px;color:#94a3b8;font-style:italic;">No items recorded on this return.</td></tr>';

const exchangeBlock = (orderReturn: OrderReturnDto): string =>
  orderReturn.exchangeOrder
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 0 0;"><tr><td style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:14px 18px;"><p style="margin:0 0 6px 0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#047857;font-weight:700;">Replacement order</p><p style="margin:0;font-size:14px;line-height:1.7;color:#065f46;"><strong>${esc(orderReturn.exchangeOrder.orderNumber)}</strong> &middot; ${money(orderReturn.exchangeOrder.grandTotal)} still to pay</p></td></tr></table>`
    : '';

const refundBlock = (orderReturn: OrderReturnDto): string => {
  if (!orderReturn.refundAmount || orderReturn.refundAmount <= 0) return '';
  const method = orderReturn.refundMethod ? String(orderReturn.refundMethod).replace(/_/g, ' ') : null;
  const reference = orderReturn.refundTransactionId ? `<br /><span style="font-size:12px;font-weight:400;color:#9fb3cd;">Ref ${esc(orderReturn.refundTransactionId)}</span>` : '';
  const settled = orderReturn.status === ReturnStatusEnum.Completed;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 0 0;"><tr><td bgcolor="#092a55" style="background:#092a55;border-radius:12px;padding:16px 20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9fb3cd;font-weight:700;">${settled ? 'Refunded' : 'Refund due'}${method ? ` &middot; ${esc(method)}` : ''}${reference}</td><td align="right" style="font-size:22px;font-weight:700;color:#ffffff;">${money(orderReturn.refundAmount)}</td></tr></table></td></tr></table>`;
};

/** Tone per status, matching the badges the admin UI shows. */
const REQUESTED_TONE = { soft: '#fef3c7', ink: '#b45309', label: 'Requested' };

const STATUS_TONE: Record<string, { soft: string; ink: string; label: string }> = {
  REQUESTED: { soft: '#fef3c7', ink: '#b45309', label: 'Requested' },
  APPROVED: { soft: '#e0f2fe', ink: '#0369a1', label: 'Approved' },
  RECEIVED: { soft: '#e0e7ff', ink: '#4338ca', label: 'Items received' },
  COMPLETED: { soft: '#d1fae5', ink: '#047857', label: 'Completed' },
  REJECTED: { soft: '#ffe4e6', ink: '#be123c', label: 'Declined' },
  CANCELLED: { soft: '#f1f5f9', ink: '#475569', label: 'Cancelled' },
};

/** What the customer is told at each step, and whether that step mails them at all. */
const customerCopy = (orderReturn: OrderReturnDto, isExchange: boolean): { subject: string; headline: string; message: string } | null => {
  const label = isExchange ? 'exchange' : 'refund';
  switch (orderReturn.status) {
    case ReturnStatusEnum.Approved:
      return {
        subject: `Your ${label} is approved`,
        headline: `Your ${label} has been approved`,
        message: `we have approved your ${label} request. Bring the items in to the store, or hand them to the courier, and we will take it from there.`,
      };
    case ReturnStatusEnum.Received:
      return {
        subject: `We have received your items`,
        headline: 'We have your items',
        message: `the items below are back with us and have been checked in. ${isExchange ? 'Your replacement order is being prepared.' : 'Your refund is being processed now.'}`,
      };
    case ReturnStatusEnum.Completed:
      return {
        subject: isExchange ? 'Your exchange is complete' : 'Your refund has been paid',
        headline: isExchange ? 'Your exchange is complete' : 'Your refund is on its way',
        message: isExchange
          ? 'your exchange is settled. The replacement order below is yours to collect or track.'
          : `your refund has been processed. Depending on your bank or payment provider it can take a few working days to appear.`,
      };
    case ReturnStatusEnum.Rejected:
      return {
        subject: `About your ${label} request`,
        headline: `We could not accept this ${label}`,
        message: `after reviewing it we are unable to accept this ${label}. The reason recorded is: "${esc(orderReturn.reason)}". Reply to this email if you would like us to look again.`,
      };
    case ReturnStatusEnum.Cancelled:
      return {
        subject: `Your ${label} request was cancelled`,
        headline: `This ${label} was cancelled`,
        message: `this request has been cancelled and nothing further will happen. Your order is unchanged.`,
      };
    // A freshly raised request mails the store, not the customer standing at the counter.
    default:
      return null;
  }
};

export const notifyAdminOfReturn = async (orderReturn: OrderReturnDto, storeName: string, storeEmail?: string | null, fallbackRecipient?: string): Promise<void> => {
  try {
    const to = storeEmail || fallbackRecipient || env.ADMIN_NOTIFY_EMAIL;
    if (!to) {
      logger.warn('return notification skipped - no store email, no admin user email and ADMIN_NOTIFY_EMAIL is not set', { returnNumber: orderReturn.returnNumber });
      return;
    }

    const isExchange = orderReturn.type === ReturnTypeEnum.Exchange;
    const typeLabel = isExchange ? 'Exchange' : 'Refund';
    const customer = orderReturn.customer;
    const customerContact = [customer?.email, customer?.phone].filter(Boolean).join(' · ') || 'No contact details on file';

    await dispatchEmailAsync({
      to,
      subject: `${typeLabel} request ${orderReturn.returnNumber} · ${money(orderReturn.refundAmount)} · ${customer?.name ?? 'Customer'}`,
      templateName: 'return-requested',
      templateData: {
        appName: env.APP_NAME,
        storeName: esc(storeName),
        returnNumber: esc(orderReturn.returnNumber),
        typeLabel,
        typeLabelLower: typeLabel.toLowerCase(),
        orderNumber: esc(orderReturn.order?.orderNumber ?? `#${orderReturn.orderId}`),
        customerName: esc(customer?.name ?? 'Walk-in customer'),
        customerContact: esc(customerContact),
        reason: esc(orderReturn.reason),
        requestedAt: when(orderReturn.createdAt),
        itemsRows: itemRows(orderReturn),
        exchangeBlock: exchangeBlock(orderReturn),
        refundAmount: money(orderReturn.refundAmount),
        adminUrl: `${env.APP_PUBLIC_URL || ''}/admin/returns/`,
      },
    });

    logger.info('return notification sent to store', { returnNumber: orderReturn.returnNumber, to });
  } catch (error) {
    logger.error('return notification to store failed', { returnNumber: orderReturn.returnNumber, error: (error as Error)?.message });
  }
};

export const notifyCustomerOfReturnStatus = async (orderReturn: OrderReturnDto, storeName: string): Promise<void> => {
  try {
    const to = orderReturn.customer?.email;
    if (!to) {
      logger.warn('return status email skipped - the customer has no email on file', { returnNumber: orderReturn.returnNumber });
      return;
    }

    const isExchange = orderReturn.type === ReturnTypeEnum.Exchange;
    const copy = customerCopy(orderReturn, isExchange);
    if (!copy) return;

    const tone = STATUS_TONE[orderReturn.status as ReturnStatus] ?? REQUESTED_TONE;
    const typeLabel = isExchange ? 'Exchange' : 'Refund';

    await dispatchEmailAsync({
      to,
      subject: `${copy.subject} · ${orderReturn.returnNumber}`,
      templateName: 'return-status',
      templateData: {
        appName: env.APP_NAME,
        storeName: esc(storeName),
        customerName: esc(orderReturn.customer?.name ?? 'there'),
        returnNumber: esc(orderReturn.returnNumber),
        orderNumber: esc(orderReturn.order?.orderNumber ?? `#${orderReturn.orderId}`),
        typeLabel,
        typeLabelLower: typeLabel.toLowerCase(),
        statusLabel: tone.label,
        statusSoft: tone.soft,
        statusInk: tone.ink,
        headline: copy.headline,
        message: copy.message,
        itemsRows: itemRows(orderReturn),
        refundBlock: refundBlock(orderReturn),
        exchangeBlock: exchangeBlock(orderReturn),
        orderUrl: `${env.APP_PUBLIC_URL || ''}/dashboard/orders/${orderReturn.orderId}/`,
      },
    });

    logger.info('return status email sent to customer', { returnNumber: orderReturn.returnNumber, status: orderReturn.status, to });
  } catch (error) {
    logger.error('return status email failed', { returnNumber: orderReturn.returnNumber, error: (error as Error)?.message });
  }
};
