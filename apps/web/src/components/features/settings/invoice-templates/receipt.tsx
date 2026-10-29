import { format } from 'date-fns';
import React from 'react';
import { invoiceTotals, InvoiceTemplateProps, lineTotal, money } from './sample-data';

// Receipt - an 80mm POS thermal-printer slip: monospace, dashed rules, centred masthead.

const Dashed = () => <div className="my-2 border-t border-dashed border-neutral-400" />;

// A thermal printer gets one colour and no greys, so the slip stays text-only and ignores logoUrl.
export default function ReceiptTemplate({ invoice }: InvoiceTemplateProps) {
  const { subtotal, tax, grandTotal, totalQuantity } = invoiceTotals(invoice);

  return (
    <div className="w-[320px] bg-white px-5 py-6 font-mono text-[12px] leading-5 text-neutral-800 shadow-sm">
      <div className="text-center">
        <p className="text-base font-bold tracking-wide text-neutral-900">{invoice.store.name.toUpperCase()}</p>
        <p className="text-[11px] text-neutral-500">{invoice.store.address}</p>
        <p className="text-[11px] text-neutral-500">Ph: {invoice.store.phone}</p>
      </div>

      <Dashed />
      <div className="flex justify-between">
        <span>Bill: {invoice.number}</span>
        <span>{invoice.store.code}</span>
      </div>
      <div className="flex justify-between">
        <span>{format(invoice.issuedAt, 'dd/MM/yyyy')}</span>
        <span>{format(invoice.issuedAt, 'h:mm a')}</span>
      </div>
      <p>Cust: {invoice.customer.name}</p>
      <Dashed />

      <div className="flex justify-between font-bold">
        <span>ITEM</span>
        <span>AMOUNT</span>
      </div>
      {invoice.items.map((item) => (
        <div key={item.name} className="mt-1">
          <p className="truncate">{item.name}</p>
          <div className="flex justify-between text-neutral-600">
            <span>
              {item.quantity} x {money(item.unitPrice)}
            </span>
            <span className="font-semibold text-neutral-900">{money(lineTotal(item))}</span>
          </div>
        </div>
      ))}

      <Dashed />
      <div className="flex justify-between">
        <span>
          Items: {invoice.items.length} / Qty: {totalQuantity}
        </span>
        <span>{money(subtotal)}</span>
      </div>
      <div className="flex justify-between text-neutral-600">
        <span>Discount</span>
        <span>- {money(invoice.discount)}</span>
      </div>
      <div className="flex justify-between text-neutral-600">
        <span>GST ({invoice.taxRate * 100}%)</span>
        <span>{money(tax)}</span>
      </div>
      <div className="flex justify-between text-neutral-600">
        <span>Delivery</span>
        <span>{money(invoice.shipping)}</span>
      </div>

      <Dashed />
      <div className="flex justify-between text-sm font-bold text-neutral-900">
        <span>TOTAL</span>
        <span>{money(grandTotal)}</span>
      </div>
      <div className="flex justify-between text-neutral-600">
        <span>{invoice.payment.method}</span>
        <span>{invoice.payment.status.toUpperCase()}</span>
      </div>
      <Dashed />

      <div className="mt-3 text-center">
        <p className="font-bold">*** THANK YOU, VISIT AGAIN ***</p>
        <p className="mt-1 text-[11px] text-neutral-500">Exchange within 7 days with this bill.</p>
        <p className="mt-3 text-[10px] tracking-[0.3em] text-neutral-400">|| |||| | || ||| | |||| ||</p>
      </div>
    </div>
  );
}
