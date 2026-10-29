import { format } from 'date-fns';
import React from 'react';
import { amountInWords, invoiceTotals, InvoiceTemplateProps, lineTotal, money } from './sample-data';

// Classic - the brand navy/teal layout mirroring the jsPDF invoice: masthead, summary strip, ruled table, navy total bar.

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-sky-100 text-sky-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

export default function ClassicTemplate({ invoice, logoUrl }: InvoiceTemplateProps) {
  const { subtotal, tax, grandTotal, totalQuantity } = invoiceTotals(invoice);

  return (
    <div className="w-[794px] bg-white p-10 font-sans text-slate-700 shadow-sm">
      <div className="-mx-10 -mt-10 mb-8 flex h-1.5">
        <div className="w-1/3 bg-[#02a98f]" />
        <div className="flex-1 bg-[#092a55]" />
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-12 max-w-[140px] object-contain" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#092a55] text-base font-bold text-white">{invoice.store.name.slice(0, 2).toUpperCase()}</div>
          )}
          <div>
            <p className="text-xl font-bold text-slate-900">{invoice.store.name}</p>
            <p className="text-xs text-slate-400">
              Store {invoice.store.code} · {invoice.store.phone}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Tax Invoice</p>
          <p className="text-2xl font-bold text-[#092a55]">#{invoice.number}</p>
          <span className={`mt-1 inline-block rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest ${STATUS_CLASS[invoice.status]}`}>{invoice.status}</span>
        </div>
      </div>

      <div className="mt-6 border-b border-slate-200 border-t-2 border-t-[#092a55]" />

      <div className="mt-5 grid grid-cols-3 gap-4 rounded-md border-l-4 border-l-[#02a98f] bg-slate-50 p-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Invoice date</p>
          <p className="font-semibold text-slate-900">{format(invoice.issuedAt, 'dd MMM yyyy')}</p>
          <p className="text-xs text-slate-500">{format(invoice.issuedAt, 'h:mm a')}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Payment</p>
          <p className="font-semibold text-slate-900">{invoice.payment.method}</p>
          <p className="text-xs text-slate-500">
            {invoice.items.length} lines · {totalQuantity} qty
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount payable</p>
          <p className="text-xl font-bold text-[#092a55]">{money(grandTotal)}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-8 text-sm">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Billed from</p>
          <p className="mt-1 font-semibold text-slate-900">{invoice.store.name}</p>
          <p className="text-xs leading-5 text-slate-500">
            {invoice.store.address}
            <br />
            {invoice.store.phone} · {invoice.store.email}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Billed to</p>
          <p className="mt-1 font-semibold text-slate-900">{invoice.customer.name}</p>
          <p className="text-xs leading-5 text-slate-500">
            {invoice.customer.address}
            <br />
            {invoice.customer.phone} · {invoice.customer.email}
          </p>
        </div>
      </div>

      <table className="mt-7 w-full text-sm">
        <thead>
          <tr className="border-y-2 border-y-[#092a55] bg-slate-100 text-[10px] uppercase tracking-widest text-[#092a55]">
            <th className="px-2 py-2 text-left font-bold">#</th>
            <th className="px-2 py-2 text-left font-bold">Description</th>
            <th className="px-2 py-2 text-right font-bold">Rate</th>
            <th className="px-2 py-2 text-center font-bold">Qty</th>
            <th className="px-2 py-2 text-right font-bold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={item.name} className="border-b border-slate-100">
              <td className="px-2 py-2.5 text-xs text-slate-400">{String(index + 1).padStart(2, '0')}</td>
              <td className="px-2 py-2.5">
                <p className="font-semibold text-slate-900">{item.name}</p>
                {(item.variant || item.sku) && <p className="text-xs text-slate-500">{[item.variant, item.sku].filter(Boolean).join(' · ')}</p>}
              </td>
              <td className="px-2 py-2.5 text-right">{money(item.unitPrice)}</td>
              <td className="px-2 py-2.5 text-center">{item.quantity}</td>
              <td className="px-2 py-2.5 text-right font-semibold text-slate-900">{money(lineTotal(item))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 grid grid-cols-2 gap-8">
        <div className="text-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount in words</p>
          <p className="mt-1 italic text-slate-600">{amountInWords(grandTotal)}</p>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Notes</p>
          <p className="mt-1 text-xs text-slate-500">{invoice.notes}</p>
        </div>
        <div className="text-sm">
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold text-slate-900">{money(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Discount</span>
              <span className="font-semibold text-rose-600">- {money(invoice.discount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">GST ({invoice.taxRate * 100}%)</span>
              <span className="font-semibold text-slate-900">{money(tax)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Shipping & fees</span>
              <span className="font-semibold text-slate-900">{money(invoice.shipping)}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-md border-l-4 border-l-[#02a98f] bg-[#092a55] px-4 py-3 text-white">
            <span className="text-[10px] font-bold uppercase tracking-widest">Total payable</span>
            <span className="text-xl font-bold">{money(grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="mt-12 flex items-end justify-between border-t border-slate-200 pt-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Thank you for your business.</p>
          <p className="text-[11px] text-slate-400">This is a computer-generated invoice and does not require a signature.</p>
        </div>
        <div className="text-right">
          <div className="mb-1 w-44 border-t border-slate-300" />
          <p className="text-xs font-semibold">For {invoice.store.name}</p>
          <p className="text-[11px] text-slate-400">Authorised signatory</p>
        </div>
      </div>
    </div>
  );
}
