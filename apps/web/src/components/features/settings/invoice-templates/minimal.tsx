import { format } from 'date-fns';
import React from 'react';
import { amountInWords, invoiceTotals, InvoiceTemplateProps, lineTotal, money } from './sample-data';

// Minimal - monochrome, serif display heading, hairline rules and generous whitespace; prints cleanly on any printer.

export default function MinimalTemplate({ invoice, logoUrl }: InvoiceTemplateProps) {
  const { subtotal, tax, grandTotal } = invoiceTotals(invoice);

  return (
    <div className="w-[794px] bg-white p-12 font-sans text-neutral-800 shadow-sm">
      <div className="flex items-end justify-between">
        <h1 className="font-serif text-5xl font-light tracking-tight text-neutral-900">Invoice</h1>
        <div className="text-right text-xs leading-5 text-neutral-500">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="mb-2 ml-auto h-9 max-w-[130px] object-contain" />
          )}
          <p className="text-sm font-semibold text-neutral-900">{invoice.store.name}</p>
          <p>{invoice.store.address}</p>
          <p>
            {invoice.store.phone} · {invoice.store.email}
          </p>
        </div>
      </div>

      <div className="mt-8 border-t border-neutral-900" />

      <div className="mt-6 grid grid-cols-4 gap-6 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">Invoice no.</p>
          <p className="mt-1 font-medium">{invoice.number}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">Date</p>
          <p className="mt-1 font-medium">{format(invoice.issuedAt, 'dd.MM.yyyy')}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">Payment</p>
          <p className="mt-1 font-medium">{invoice.payment.method}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">Status</p>
          <p className="mt-1 font-medium">{invoice.status === 'DELIVERED' ? 'Paid' : invoice.status.toLowerCase()}</p>
        </div>
      </div>

      <div className="mt-8 text-sm">
        <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">Billed to</p>
        <p className="mt-1 font-medium text-neutral-900">{invoice.customer.name}</p>
        <p className="text-xs leading-5 text-neutral-500">
          {invoice.customer.address}
          <br />
          {invoice.customer.phone} · {invoice.customer.email}
        </p>
      </div>

      <table className="mt-10 w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-900 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
            <th className="py-2 text-left font-medium">Description</th>
            <th className="py-2 text-right font-medium">Rate</th>
            <th className="py-2 text-center font-medium">Qty</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item) => (
            <tr key={item.name} className="border-b border-neutral-200">
              <td className="py-3">
                <p className="font-medium text-neutral-900">{item.name}</p>
                {item.variant && <p className="text-xs text-neutral-400">{item.variant}</p>}
              </td>
              <td className="py-3 text-right tabular-nums">{money(item.unitPrice)}</td>
              <td className="py-3 text-center tabular-nums">{item.quantity}</td>
              <td className="py-3 text-right font-medium tabular-nums text-neutral-900">{money(lineTotal(item))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end">
        <div className="w-64 space-y-1.5 text-sm tabular-nums">
          <div className="flex justify-between text-neutral-500">
            <span>Subtotal</span>
            <span>{money(subtotal)}</span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>Discount</span>
            <span>- {money(invoice.discount)}</span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>GST ({invoice.taxRate * 100}%)</span>
            <span>{money(tax)}</span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>Shipping</span>
            <span>{money(invoice.shipping)}</span>
          </div>
          <div className="mt-2 flex justify-between border-b-4 border-t border-b-neutral-900 border-t-neutral-900 py-2 text-base font-semibold text-neutral-900 [border-bottom-style:double]">
            <span>Total</span>
            <span>{money(grandTotal)}</span>
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs italic text-neutral-500">{amountInWords(grandTotal)}</p>

      <div className="mt-16 flex items-end justify-between text-xs text-neutral-400">
        <p>{invoice.notes}</p>
        <div className="text-right">
          <div className="mb-1 w-40 border-t border-neutral-300" />
          <p className="font-medium text-neutral-600">Authorised signatory</p>
        </div>
      </div>
    </div>
  );
}
