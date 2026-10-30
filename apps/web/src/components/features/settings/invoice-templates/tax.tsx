import { format } from 'date-fns';
import React from 'react';
import { amountInWords, invoiceTotals, InvoiceTemplateProps, lineTotal, money } from './sample-data';

// Tax Invoice - the GST-style boxed layout from the accounting-app bills: ruled boxes throughout,
// an HSN/SAC column, received/balance rows and a "For <company>" signatory box.

const CELL = 'border border-slate-300 px-2 py-1.5';
const LABEL = 'bg-slate-100 text-[11px] font-bold text-slate-800';

export default function TaxTemplate({ invoice, logoUrl }: InvoiceTemplateProps) {
  const { subtotal, tax, grandTotal, totalQuantity } = invoiceTotals(invoice);
  const balance = grandTotal - invoice.received;

  return (
    <div className="w-[794px] bg-white p-8 font-sans text-xs text-slate-700">
      <p className="mb-3 text-center text-lg font-bold text-slate-900">Tax Invoice</p>

      <div className="border border-slate-400">
        <div className="flex items-center gap-3 px-3 py-2.5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-11 max-w-[120px] object-contain" />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded bg-slate-800 text-sm font-bold text-white">{invoice.store.name.slice(0, 2).toUpperCase()}</div>
          )}
          <div>
            <p className="text-xl font-bold text-slate-900">{invoice.store.name}</p>
            <p className="text-[11px] text-slate-600">
              {invoice.store.address} · Phone: {invoice.store.phone} · {invoice.store.email}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-slate-400">
          <div className="border-r border-slate-400">
            <p className={`border-b border-slate-300 px-3 py-1 ${LABEL}`}>Bill To:</p>
            <div className="px-3 py-2">
              <p className="font-bold text-slate-900">{invoice.customer.name}</p>
              <p className="text-[11px] leading-4 text-slate-600">
                {invoice.customer.address}
                <br />
                {invoice.customer.phone} · {invoice.customer.email}
              </p>
            </div>
          </div>
          <div>
            <p className={`border-b border-slate-300 px-3 py-1 ${LABEL}`}>Invoice Details:</p>
            <div className="space-y-0.5 px-3 py-2">
              <p>
                <span className="text-slate-500">Invoice No.: </span>
                <span className="font-bold text-slate-900">{invoice.number}</span>
              </p>
              <p>
                <span className="text-slate-500">Date: </span>
                <span className="font-bold text-slate-900">{format(invoice.issuedAt, 'dd/MM/yyyy')}</span>
              </p>
              <p>
                <span className="text-slate-500">Payment: </span>
                <span className="font-bold text-slate-900">
                  {invoice.payment.method} · {invoice.payment.status}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <table className="mt-3 w-full border-collapse">
        <thead>
          <tr className={LABEL}>
            <th className={`${CELL} w-8 text-left`}>#</th>
            <th className={`${CELL} text-left`}>Item name</th>
            <th className={`${CELL} w-20 text-left`}>HSN/ SAC</th>
            <th className={`${CELL} w-20 text-right`}>Quantity</th>
            <th className={`${CELL} w-28 text-right`}>Price/ Unit(₹)</th>
            <th className={`${CELL} w-28 text-right`}>Amount(₹)</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={item.name}>
              <td className={`${CELL} text-slate-500`}>{index + 1}</td>
              <td className={CELL}>
                <span className="font-semibold text-slate-900">{item.name}</span>
                {item.variant && <span className="text-slate-500"> · {item.variant}</span>}
              </td>
              <td className={CELL}>{item.hsn ?? '—'}</td>
              <td className={`${CELL} text-right`}>{item.quantity}</td>
              <td className={`${CELL} text-right`}>{money(item.unitPrice)}</td>
              <td className={`${CELL} text-right font-semibold text-slate-900`}>{money(lineTotal(item))}</td>
            </tr>
          ))}
          <tr className="font-bold text-slate-900">
            <td className={CELL} />
            <td className={CELL}>Total</td>
            <td className={CELL} />
            <td className={`${CELL} text-right`}>{totalQuantity}</td>
            <td className={CELL} />
            <td className={`${CELL} text-right`}>{money(subtotal)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="border border-slate-400">
            <p className={`border-b border-slate-300 px-3 py-1 ${LABEL}`}>Invoice Amount in Words:</p>
            <p className="px-3 py-2 text-slate-700">{amountInWords(grandTotal)}</p>
          </div>
          <div className="mt-3 border border-slate-400">
            <p className={`border-b border-slate-300 px-3 py-1 ${LABEL}`}>Notes:</p>
            <p className="px-3 py-2 text-[11px] text-slate-600">{invoice.notes}</p>
          </div>
        </div>

        <table className="h-fit w-full border-collapse">
          <tbody>
            <tr>
              <td className={CELL}>Sub Total</td>
              <td className={`${CELL} w-32 text-right`}>{money(subtotal)}</td>
            </tr>
            <tr>
              <td className={CELL}>Discount</td>
              <td className={`${CELL} text-right`}>- {money(invoice.discount)}</td>
            </tr>
            <tr>
              <td className={CELL}>GST ({invoice.taxRate * 100}%)</td>
              <td className={`${CELL} text-right`}>{money(tax)}</td>
            </tr>
            <tr>
              <td className={CELL}>Shipping & fees</td>
              <td className={`${CELL} text-right`}>{money(invoice.shipping)}</td>
            </tr>
            <tr className="bg-slate-800 font-bold text-white">
              <td className="border border-slate-800 px-2 py-1.5">Total</td>
              <td className="border border-slate-800 px-2 py-1.5 text-right">{money(grandTotal)}</td>
            </tr>
            <tr>
              <td className={CELL}>Received</td>
              <td className={`${CELL} text-right`}>{money(invoice.received)}</td>
            </tr>
            <tr className="font-bold text-slate-900">
              <td className={CELL}>Balance</td>
              <td className={`${CELL} text-right`}>{money(balance)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <div className="w-64 border border-slate-400">
          <p className={`border-b border-slate-300 px-3 py-1 ${LABEL}`}>For {invoice.store.name}:</p>
          <div className="flex h-20 items-end justify-center pb-2">
            <p className="text-[11px] text-slate-600">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}
