import { format } from 'date-fns';
import React from 'react';
import { invoiceTotals, InvoiceTemplateProps, lineTotal, money } from './sample-data';

// Modern - a full-bleed gradient masthead, card-based details and a teal total panel; built for screens first.

export default function ModernTemplate({ invoice, logoUrl }: InvoiceTemplateProps) {
  const { subtotal, tax, grandTotal } = invoiceTotals(invoice);

  return (
    <div className="w-[794px] overflow-hidden rounded-xl bg-white font-sans text-slate-700 shadow-sm">
      <div className="bg-gradient-to-r from-[#092a55] via-[#0b3d6b] to-[#02a98f] px-10 py-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="mb-2 h-10 max-w-[150px] object-contain brightness-0 invert" />
            )}
            <p className="text-2xl font-bold">{invoice.store.name}</p>
            <p className="mt-1 max-w-xs text-xs text-white/70">{invoice.store.address}</p>
            <p className="text-xs text-white/70">
              {invoice.store.phone} · {invoice.store.email}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">Invoice</p>
            <p className="text-3xl font-bold">{invoice.number.replace('INV-', '')}</p>
            <span className="mt-2 inline-block rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur">
              {invoice.status === 'DELIVERED' ? 'Paid' : invoice.status.toLowerCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="px-10 py-8">
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Billed to</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{invoice.customer.name}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{invoice.customer.address}</p>
            <p className="text-xs text-slate-500">{invoice.customer.phone}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Invoice details</p>
            <div className="mt-1 space-y-1 text-xs">
              <p className="flex justify-between">
                <span className="text-slate-500">Issued</span>
                <span className="font-semibold text-slate-900">{format(invoice.issuedAt, 'dd MMM yyyy')}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500">Store</span>
                <span className="font-semibold text-slate-900">{invoice.store.code}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500">Payment</span>
                <span className="font-semibold text-slate-900">
                  {invoice.payment.method} · {invoice.payment.status}
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-center rounded-lg bg-[#02a98f]/10 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#02a98f]">Amount due</p>
            <p className="mt-1 text-2xl font-bold text-[#092a55]">{money(grandTotal)}</p>
            <p className="text-xs text-slate-500">Due on receipt</p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500">
                <th className="px-4 py-3 text-left font-bold">Item</th>
                <th className="px-4 py-3 text-right font-bold">Price</th>
                <th className="px-4 py-3 text-center font-bold">Qty</th>
                <th className="px-4 py-3 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={item.name} className={index % 2 ? 'bg-slate-50/60' : ''}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    {item.variant && <p className="text-xs text-slate-500">{item.variant}</p>}
                  </td>
                  <td className="px-4 py-3 text-right">{money(item.unitPrice)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block min-w-7 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold">{item.quantity}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">{money(lineTotal(item))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <div className="w-72 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium">{money(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Discount</span>
              <span className="font-medium text-rose-600">- {money(invoice.discount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">GST ({invoice.taxRate * 100}%)</span>
              <span className="font-medium">{money(tax)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Shipping</span>
              <span className="font-medium">{money(invoice.shipping)}</span>
            </div>
            <div className="mt-2 flex justify-between rounded-lg bg-[#092a55] px-4 py-2.5 text-white">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-bold">{money(grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-lg bg-slate-50 p-4 text-xs text-slate-500">
          <p className="font-semibold text-slate-700">Notes</p>
          <p className="mt-1">{invoice.notes}</p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Thank you for shopping with {invoice.store.name} · {invoice.store.email}
        </p>
      </div>
    </div>
  );
}
