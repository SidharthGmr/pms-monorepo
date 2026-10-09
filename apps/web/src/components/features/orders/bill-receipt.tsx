import config from '@/config';
import { format } from 'date-fns';
import React from 'react';

interface BillReceiptProps {
  order: any;
}

/** Paise always shown, because a bill that rounds is a bill that gets queried. */
const money = (value?: number | null) => `₹${Number(value ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const underHundred = (n: number): string => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`);

// Indian grouping - crore, lakh, thousand - so the words match the digits beside them.
const toWords = (n: number): string => {
  if (n === 0) return 'Zero';
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = Math.floor((n % 1000) / 100);
  const rest = n % 100;
  if (crore) parts.push(`${toWords(crore)} Crore`);
  if (lakh) parts.push(`${underHundred(lakh)} Lakh`);
  if (thousand) parts.push(`${underHundred(thousand)} Thousand`);
  if (hundred) parts.push(`${ONES[hundred]} Hundred`);
  if (rest) parts.push(underHundred(rest));
  return parts.join(' ');
};

const amountInWords = (value: number): string => {
  const rupees = Math.floor(Math.abs(value));
  const paise = Math.round((Math.abs(value) - rupees) * 100);
  return `${toWords(rupees)} Rupees${paise ? ` and ${underHundred(paise)} Paise` : ''} Only`;
};

const STATUS_TONE: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-sky-50 text-sky-700 border-sky-200',
  SHIPPED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
  RETURNED: 'bg-orange-50 text-orange-700 border-orange-200',
};

/**
 * The printable bill, and the thing the PDF is rendered from. Everything here is fixed to an A4
 * column width and uses no responsive classes: the capture happens off-screen, where the viewport
 * that drives `sm:`/`md:` has nothing to do with how wide this document is.
 */
const BillReceipt = React.forwardRef<HTMLDivElement, BillReceiptProps>(({ order }, ref) => {
  if (!order) return null;

  const issued = order.createdAt ? format(new Date(order.createdAt), 'dd MMM yyyy') : '—';
  const issuedTime = order.createdAt ? format(new Date(order.createdAt), 'h:mm a') : undefined;
  const items = order.items ?? [];
  const status = String(order.status ?? 'CONFIRMED').toUpperCase();
  const tone = STATUS_TONE[status] ?? 'bg-slate-100 text-slate-700 border-slate-200';

  const storeName = order.store?.name || config.appName;
  const customerName = order.customer?.name || [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(' ') || 'Walk-in customer';

  const totalQty = items.reduce((sum: number, item: any) => sum + (item.quantity ?? 0), 0);
  const subtotal = Number(order.totalAmount ?? 0);
  const discount = Number(order.discount ?? 0);
  const tax = Number(order.tax ?? 0);
  const shipping = Number(order.shippingCost ?? 0);
  const grandTotal = Number(order.grandTotal ?? 0);

  return (
    <div ref={ref} className="mx-auto w-[794px] bg-white text-slate-900" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="h-1.5 w-full bg-slate-900" />

      <div className="px-12 pb-10 pt-9">
        <div className="flex items-start justify-between gap-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-base font-bold text-white">
              {storeName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold leading-tight text-slate-900">{storeName}</p>
              {order.store?.code && <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400">Store {order.store.code}</p>}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Tax Invoice</p>
            <p className="mt-0.5 font-mono text-2xl font-bold tracking-tight text-slate-900">#{order.orderNumber || order.id}</p>
            <span className={`mt-2 inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone}`}>{status}</span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-6 rounded-lg bg-slate-50 px-5 py-4">
          <Meta label="Invoice date" value={issued} hint={issuedTime} />
          <Meta label="Items" value={`${items.length} ${items.length === 1 ? 'product' : 'products'}`} hint={`${totalQty} qty in total`} />
          <Meta label="Amount payable" value={money(grandTotal)} hint={order.createdByName ? `Billed by ${order.createdByName}` : undefined} strong />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-10">
          <Party heading="From" name={storeName} lines={[order.store?.address, order.store?.phone, order.store?.email].filter(Boolean) as string[]} />
          <Party heading="Bill to" name={customerName} lines={[order.customer?.email, order.customer?.phone].filter(Boolean) as string[]} />
        </div>

        <table className="mt-8 w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="w-8 rounded-l-md py-2.5 pl-4 pr-2 text-[10px] font-bold uppercase tracking-wider">#</th>
              <th className="px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider">Description</th>
              <th className="w-28 px-2 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider">Rate</th>
              <th className="w-16 px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider">Qty</th>
              <th className="w-32 rounded-r-md py-2.5 pl-2 pr-4 text-right text-[10px] font-bold uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, index: number) => {
              const name = item.product?.name || `Product #${item.productId}`;
              const variant = item.variant?.name && item.product?.name ? item.variant.name.replace(`${item.product.name} - `, '') : item.variant?.name;
              const amount = (item.unitPrice ?? 0) * (item.quantity ?? 1);

              return (
                <tr key={item.id ?? index} className="border-b border-slate-100 align-top">
                  <td className="py-3.5 pl-4 pr-2 text-xs tabular-nums text-slate-400">{index + 1}</td>
                  <td className="px-2 py-3.5">
                    <p className="text-sm font-semibold leading-snug text-slate-900">{name}</p>
                    {(variant || item.variant?.sku) && (
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {variant}
                        {variant && item.variant?.sku ? ' · ' : ''}
                        {item.variant?.sku && <span className="font-mono">{item.variant.sku}</span>}
                      </p>
                    )}
                  </td>
                  <td className="px-2 py-3.5 text-right text-sm tabular-nums text-slate-600">{money(item.unitPrice)}</td>
                  <td className="px-2 py-3.5 text-center text-sm tabular-nums text-slate-600">{item.quantity}</td>
                  <td className="py-3.5 pl-2 pr-4 text-right text-sm font-semibold tabular-nums text-slate-900">{money(amount)}</td>
                </tr>
              );
            })}

            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm italic text-slate-400">
                  No items on this order.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-6 flex items-start justify-between gap-10">
          <div className="w-[52%] pt-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount in words</p>
            <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-700">{amountInWords(grandTotal)}</p>

            {order.notes && (
              <div className="mt-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Notes</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{order.notes}</p>
              </div>
            )}
          </div>

          <div className="w-[48%]">
            <div className="space-y-2.5 rounded-lg border border-slate-200 px-5 py-4 text-sm">
              <Row label="Subtotal" value={money(subtotal)} />
              {discount > 0 && <Row label="Discount" value={`- ${money(discount)}`} negative />}
              {tax > 0 && <Row label="Tax" value={money(tax)} />}
              {shipping > 0 && <Row label="Shipping &amp; fees" value={money(shipping)} />}
            </div>
            <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-900 px-5 py-3.5 text-white">
              <span className="text-[11px] font-bold uppercase tracking-widest">Total</span>
              <span className="text-2xl font-bold tabular-nums tracking-tight">{money(grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-end justify-between gap-10 border-t border-slate-200 pt-5">
          <p className="max-w-[60%] text-[11px] leading-relaxed text-slate-400">
            This is a computer-generated invoice and does not require a signature.
          </p>
          <div className="text-right">
            <div className="h-10" />
            <p className="w-48 border-t border-slate-300 pt-1.5 text-[11px] text-slate-500">Authorised signatory</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-slate-50 px-12 py-3 text-[10px] text-slate-400">
        <span>Thank you for your business.</span>
        <span className="font-mono">
          {order.orderNumber || order.id} · {issued}
        </span>
      </div>
    </div>
  );
});

BillReceipt.displayName = 'BillReceipt';

function Meta({ label, value, hint, strong }: { label: string; value: string; hint?: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`mt-1 truncate ${strong ? 'text-base font-bold text-slate-900' : 'text-sm font-semibold text-slate-800'}`}>{value}</p>
      {hint && <p className="truncate text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

function Party({ heading, name, lines }: { heading: string; name: string; lines: string[] }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{heading}</p>
      <p className="mt-1.5 text-sm font-bold text-slate-900">{name}</p>
      {lines.length > 0 ? (
        <div className="mt-1 space-y-0.5">
          {lines.map((line) => (
            <p key={line} className="text-xs leading-relaxed text-slate-600">
              {line}
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-xs italic text-slate-400">No contact details on file</p>
      )}
    </div>
  );
}

function Row({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={`font-semibold tabular-nums ${negative ? 'text-rose-600' : 'text-slate-900'}`}>{value}</span>
    </div>
  );
}

export default BillReceipt;
