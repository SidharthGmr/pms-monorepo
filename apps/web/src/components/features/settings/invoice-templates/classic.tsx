import { format } from 'date-fns';
import React from 'react';
import { amountInWords, invoiceTotals, InvoiceTemplateProps, lineTotal, money } from './sample-data';

// Classic - the brand navy/teal layout mirroring the jsPDF invoice: masthead, summary strip,
// ruled zebra table, navy total bar with received/balance settlement, bookended brand strips.

const NAVY = '#092a55';
const TEAL = '#02a98f';

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-sky-100 text-sky-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

function Label({ children, align }: { children: React.ReactNode; align?: 'right' }) {
  return <p className={`text-[10px] font-bold uppercase tracking-widest text-slate-400 ${align === 'right' ? 'text-right' : ''}`}>{children}</p>;
}

export default function ClassicTemplate({ invoice, logoUrl }: InvoiceTemplateProps) {
  const { subtotal, tax, grandTotal, totalQuantity } = invoiceTotals(invoice);
  const received = Math.min(invoice.received, grandTotal);
  const balance = Math.round((grandTotal - received) * 100) / 100;

  return (
    <div className="w-[794px] bg-white p-8 font-sans text-slate-700 shadow-sm">
      <div className="-mx-10 -mt-10 mb-8 flex h-2">
        <div className="w-1/3" style={{ backgroundColor: TEAL }} />
        <div className="flex-1" style={{ backgroundColor: NAVY }} />
      </div>

      <div className="flex items-start justify-between">
        <div className="">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-14 max-w-[200px] object-contain" />
          ) : (
            <div
              className="relative flex h-14 w-14 items-center justify-center rounded-md text-lg font-bold text-white"
              style={{ backgroundColor: NAVY }}
            >
              {invoice.store.name.slice(0, 2).toUpperCase()}
              <span className="absolute bottom-0 left-0 h-1 w-full rounded-b-md" style={{ backgroundColor: TEAL }} />
            </div>
          )}
          <div>
            <p className="m-0 p-0 text-xs text-slate-500">
              {[invoice.store.code ? `Store ${invoice.store.code}` : '', invoice.store.phone].filter(Boolean).join(' · ')}
            </p>
            {invoice.store.email && <p className="text-xs text-slate-400">{invoice.store.email}</p>}
          </div>
        </div>

        <div className="text-right">
          {/* <p className="inline-block border-b-2 pb-0.5 text-[11px] font-bold uppercase tracking-[0.3em]" style={{ borderColor: TEAL, color: NAVY }}>
            Tax Invoice
          </p> */}
          <p className="mt-1.5 text-xs text-slate-500">
            {format(invoice.issuedAt, 'dd MMM yyyy')} · {format(invoice.issuedAt, 'h:mm a')}
          </p>
          <p className="mt-1.5 text-[26px] font-bold border-b-2 pb-0.5 leading-none tracking-tight" style={{ color: NAVY }}>
            #{invoice.number}
          </p>

          {/* <div className="mt-1.5 flex items-center justify-end gap-1.5">
            <span className={`inline-block rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest ${STATUS_CLASS[invoice.status]}`}>
              {invoice.status}
            </span>
            <span
              className={`inline-block rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                balance <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {balance <= 0 ? 'Paid' : 'Balance due'}
            </span>
          </div> */}
        </div>
      </div>

      <div className="mt-2 overflow-hidden rounded-md border border-l-4 border-slate-200" style={{ borderLeftColor: TEAL }}>
        <div className="grid grid-cols-2 divide-x divide-slate-200">
          <div className="px-4 py-3">
            <div className="flex items-center gap-1">
              <Label>
                Billed from <span className="text-sm font-bold text-slate-900">{invoice.store.name}</span>
              </Label>
            </div>
            <p className="text-xs leading-5 text-slate-500 p-0">{[invoice.store.address, invoice.store.phone, invoice.store.email].filter(Boolean).join(' · ')}</p>
          </div>
          <div className="px-4 py-3">
            <div className="flex items-center gap-1">
              <Label>
                Billed to <span className="text-sm font-bold text-slate-900">{invoice.customer.name}</span>
              </Label>
            </div>
            <p className="text-xs leading-5 text-slate-500 p-0">
              {[invoice.customer.address, invoice.customer.phone, invoice.customer.email].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
      </div>

      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-widest text-white" style={{ backgroundColor: NAVY }}>
            <th className="w-10 py-2.5 pl-3 pr-2 text-left font-bold">#</th>
            <th className="px-2 py-2.5 text-left font-bold">Description</th>
            <th className="w-28 px-2 py-2.5 text-right font-bold">Rate</th>
            <th className="w-16 px-2 py-2.5 text-center font-bold">Qty</th>
            <th className="w-32 py-2.5 pl-2 pr-3 text-right font-bold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={item.name} className={`border-b border-slate-100 ${index % 2 === 1 ? 'bg-slate-50' : ''}`}>
              <td className="p-2 text-xs tabular-nums text-slate-400">{String(index + 1).padStart(2, '0')}</td>
              <td className="p-2">
                <span className="font-semibold text-xs text-slate-900">{item.name}</span>
                {item.variant && <span className="mt-0.5 text-xs text-slate-500 block">{[item.variant].filter(Boolean).join(' · ')}</span>}
              </td>
              <td className="px-2 py-3 text-right tabular-nums text-slate-600">{money(item.unitPrice)}</td>
              <td className="px-2 py-3 text-center tabular-nums text-slate-600">{item.quantity}</td>
              <td className="py-3 pl-2 pr-3 text-right font-semibold tabular-nums" style={{ color: NAVY }}>
                {money(lineTotal(item))}
              </td>
            </tr>
          ))}
          <tr className="border-b-2" style={{ borderBottomColor: NAVY }}>
            <td colSpan={3} className="py-2 pl-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Total quantity
            </td>
            <td className="px-2 py-2 text-center text-sm font-bold tabular-nums text-slate-900">{totalQuantity}</td>
            <td />
          </tr>
        </tbody>
      </table>

      <div className="mt-6 grid grid-cols-2 gap-8">
        <div className="text-sm">
          <div className="rounded-md border border-dashed border-slate-300 p-3.5">
            <Label>Amount in words</Label>
            <p className="mt-1 text-[13px] font-medium italic leading-relaxed text-slate-700">{amountInWords(grandTotal)}</p>
          </div>
          <div className="mt-4">
            <Label>Terms &amp; notes</Label>
            <p className="mt-1 text-xs leading-5 text-slate-500">{invoice.notes}</p>
          </div>
        </div>

        <div className="text-sm">
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold tabular-nums text-slate-900">{money(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Discount</span>
              <span className="font-semibold tabular-nums text-rose-600">- {money(invoice.discount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">GST ({invoice.taxRate * 100}%)</span>
              <span className="font-semibold tabular-nums text-slate-900">{money(tax)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Shipping &amp; fees</span>
              <span className="font-semibold tabular-nums text-slate-900">{money(invoice.shipping)}</span>
            </div>
          </div>

          <div
            className="mt-3 flex items-center justify-between rounded-md border-l-4 px-4 py-3 text-white"
            style={{ backgroundColor: NAVY, borderLeftColor: TEAL }}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest">Total payable</span>
            <span className="text-[22px] font-bold tabular-nums tracking-tight">{money(grandTotal)}</span>
          </div>

          <div className="mt-2 space-y-1 rounded-md bg-slate-50 px-4 py-2.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Payment</span>
              <span className="font-semibold text-slate-900">
                {invoice.payment.method} · {invoice.payment.status}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Received</span>
              <span className="font-semibold tabular-nums text-emerald-600">{money(received)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-500">Balance due</span>
              <span className={`font-bold tabular-nums ${balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{money(balance)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex items-end justify-between border-t border-slate-200 pt-4">
        <div>
          <p className="text-sm font-semibold" style={{ color: NAVY }}>
            Thank you for your business.
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">This is a computer-generated invoice and does not require a signature.</p>
        </div>
        <div className="pt-6 text-right">
          <div className="mb-1.5 w-44 border-t border-slate-300" />
          <p className="text-xs font-semibold text-slate-900">For {invoice.store.name}</p>
          <p className="text-[11px] text-slate-400">Authorised signatory</p>
        </div>
      </div>

      <div className="-mx-10 -mb-10 mt-8 flex h-2">
        <div className="flex-1" style={{ backgroundColor: NAVY }} />
        <div className="w-1/3" style={{ backgroundColor: TEAL }} />
      </div>
    </div>
  );
}
