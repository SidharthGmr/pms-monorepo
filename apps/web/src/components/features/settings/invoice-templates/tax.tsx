import { format } from 'date-fns';
import React from 'react';
import { amountInWords, InvoiceTemplateProps, invoiceTotals, lineTotal, money, taxLabel } from './sample-data';

const CELL = 'border border-slate-300 px-2 py-1.5';
const LABEL = 'bg-slate-100 text-[11px] font-bold text-slate-800';
const BOX = 'border border-slate-400 px-3';

export default function TaxTemplate({ invoice, logoUrl }: InvoiceTemplateProps) {
  const { subtotal, tax, grandTotal, totalQuantity } = invoiceTotals(invoice);
  const balance = grandTotal - invoice.received;
  const itemDiscountTotal = invoice.items.reduce((sum, item) => sum + (item.discount ?? 0), 0);
  const itemTaxTotal = invoice.items.reduce((sum, item) => sum + (item.tax ?? 0), 0);
  const storeContact = [invoice.store.address, invoice.store.phone && `Phone: ${invoice.store.phone}`, invoice.store.email]
    .filter(Boolean)
    .join(' · ');
  const customerContact = [invoice.customer.phone, invoice.customer.email].filter(Boolean).join(' · ');

  return (
    <div className="w-[794px] bg-white p-8 font-sans text-xs text-slate-700">
      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <td className="pb-2 text-center text-base font-bold uppercase tracking-[0.2em] text-slate-900">Tax Invoice</td>
          </tr>
        </tbody>
      </table>

      {/* Masthead: the logo in a fixed left cell, the store name and contact right-aligned beside it. */}
      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <td className="h-[72px] w-36 border border-slate-400 px-3 py-2 text-center align-middle">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="inline-block max-h-12 max-w-full object-contain" />
              ) : (
                <span className="inline-flex h-11 w-11 items-center justify-center rounded bg-slate-800 text-sm font-bold text-white">
                  {invoice.store.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </td>
            <td className="border border-slate-400 border-l-slate-300 px-3 py-2 text-right align-middle">
              <span className="block text-xl font-bold leading-tight text-slate-900">{invoice.store.name}</span>
              {invoice.store.gstin && <span className="mt-0.5 block text-[11px] font-bold leading-4 text-slate-800">GSTIN: {invoice.store.gstin}</span>}
              {storeContact && <span className="mt-1 block text-[11px] leading-4 text-slate-600">{storeContact}</span>}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Bill To / Invoice Details. -mt-px overlaps the masthead's bottom rule so the boxes read as one. */}
      <table className="-mt-px w-full border-collapse">
        <tbody>
          <tr className={LABEL}>
            <td className={`${BOX} w-1/2 py-1`}>
              Bill To: <span className="font-bold text-slate-900">{invoice.customer.name}</span>
            </td>
            <td className={`${BOX} w-1/2 py-1`}>Invoice Details:</td>
          </tr>
          <tr className="align-top">
            <td className={`${BOX} py-2`}>
              <span className="block text-[11px] leading-4 text-slate-600">{invoice.customer.address}</span>
              {invoice.customer.gstin && <span className="block text-[11px] font-bold leading-4 text-slate-800">GSTIN: {invoice.customer.gstin}</span>}
              {customerContact && <span className="block text-[11px] leading-4 text-slate-600">{customerContact}</span>}
            </td>
            <td className={`${BOX} py-2`}>
              <table className="w-full border-collapse text-[11px] leading-4">
                <tbody>
                  <tr>
                    <td className="w-20 pb-1 text-slate-500">Invoice No.:</td>
                    <td className="pb-1 font-bold text-slate-900">{invoice.number}</td>
                  </tr>
                  <tr>
                    <td className="pb-1 text-slate-500">Date:</td>
                    <td className="pb-1 font-bold text-slate-900">{format(invoice.issuedAt, 'dd/MM/yyyy')}</td>
                  </tr>
                  <tr>
                    <td className="text-slate-500">Payment:</td>
                    <td className="font-bold text-slate-900">
                      {invoice.payment.method} · {invoice.payment.status}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      <table className="mt-3 w-full border-collapse">
        <thead>
          <tr className={LABEL}>
            <th className={`${CELL} w-8 text-left`}>#</th>
            <th className={`${CELL} text-left`}>Item name</th>
            <th className={`${CELL} w-16 text-left`}>HSN/ SAC</th>
            <th className={`${CELL} w-12 text-right`}>Qty</th>
            <th className={`${CELL} w-24 text-right`}>Price/ Unit(₹)</th>
            <th className={`${CELL} w-20 text-right`}>Discount(₹)</th>
            <th className={`${CELL} w-20 text-right`}>Tax(₹)</th>
            <th className={`${CELL} w-24 text-right`}>Amount(₹)</th>
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
              <td className={`${CELL} text-right`}>{item.discount ? `- ${money(item.discount)}` : '—'}</td>
              <td className={`${CELL} text-right`}>{item.tax ? money(item.tax) : '—'}</td>
              <td className={`${CELL} text-right font-semibold text-slate-900`}>{money(lineTotal(item))}</td>
            </tr>
          ))}
          <tr className="font-bold text-slate-900">
            <td className={CELL} />
            <td className={CELL}>Total</td>
            <td className={CELL} />
            <td className={`${CELL} text-right`}>{totalQuantity}</td>
            <td className={CELL} />
            <td className={`${CELL} text-right`}>{itemDiscountTotal ? `- ${money(itemDiscountTotal)}` : '—'}</td>
            <td className={`${CELL} text-right`}>{itemTaxTotal ? money(itemTaxTotal) : '—'}</td>
            <td className={`${CELL} text-right`}>{money(subtotal)}</td>
          </tr>
        </tbody>
      </table>

      {/* Bottom: amount-in-words + notes on the left, the totals register on the right. */}
      <table className="mt-3 w-full border-collapse">
        <tbody>
          <tr className="align-top">
            <td className="w-1/2 pr-3">
              <table className="w-full border-collapse">
                <tbody>
                  <tr className={LABEL}>
                    <td className={`${BOX} border-b-slate-300 py-1`}>Invoice Amount in Words:</td>
                  </tr>
                  <tr>
                    <td className={`${BOX} border-t-0 py-2 text-[11px] font-medium italic text-slate-700`}>{amountInWords(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
              <table className="mt-3 w-full border-collapse">
                <tbody>
                  <tr className={LABEL}>
                    <td className={`${BOX} border-b-slate-300 py-1`}>Notes:</td>
                  </tr>
                  <tr>
                    <td className={`${BOX} border-t-0 py-2 text-[11px] text-slate-600`}>{invoice.notes}</td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td className="w-1/2">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td className={CELL}>Sub Total</td>
                    <td className={`${CELL} w-32 text-right`}>{money(subtotal)}</td>
                  </tr>
                  <tr>
                    <td className={CELL}>Discount</td>
                    <td className={`${CELL} text-right`}>- {money(invoice.discount)}</td>
                  </tr>
                  {tax > 0 && invoice.isInterState === true && (
                    <tr>
                      <td className={CELL}>IGST</td>
                      <td className={`${CELL} text-right`}>{money(tax)}</td>
                    </tr>
                  )}
                  {tax > 0 && invoice.isInterState === false && (
                    <>
                      <tr>
                        <td className={CELL}>CGST</td>
                        <td className={`${CELL} text-right`}>{money(Math.round((tax / 2) * 100) / 100)}</td>
                      </tr>
                      <tr>
                        <td className={CELL}>SGST</td>
                        <td className={`${CELL} text-right`}>{money(Math.round((tax - Math.round((tax / 2) * 100) / 100) * 100) / 100)}</td>
                      </tr>
                    </>
                  )}
                  <tr>
                    <td className={CELL}>{taxLabel(invoice)}</td>
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
            </td>
          </tr>
        </tbody>
      </table>

      {/* Signatory box, right-aligned via the table's own margin. */}
      <table className="ml-auto mt-6 w-64 border-collapse">
        <tbody>
          <tr className={LABEL}>
            <td className={`${BOX} border-b-slate-300 py-1`}>For {invoice.store.name}:</td>
          </tr>
          <tr>
            <td className={`${BOX} h-20 border-t-0 pb-2 text-center align-bottom text-[11px] text-slate-600`}>Authorized Signatory</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
