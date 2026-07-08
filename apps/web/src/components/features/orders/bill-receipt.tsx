import React from "react";
import { format } from "date-fns";
import { MapPin, Phone, Mail, Globe, Receipt, CheckCircle2 } from "lucide-react";

interface BillReceiptProps {
  order: any;
}

const BillReceipt = React.forwardRef<HTMLDivElement, BillReceiptProps>(
  ({ order }, ref) => {
    if (!order) return null;

    const datePlaced = order.createdAt
      ? format(new Date(order.createdAt), "MMM dd, yyyy")
      : "—";

    return (
      <div
        ref={ref}
        className="bg-white text-slate-900 w-full max-w-[850px] mx-auto overflow-hidden shadow-2xl rounded-xl border border-slate-200"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Top Accent Bar */}
        <div className="h-3 w-full bg-slate-900"></div>

        <div className="p-10 space-y-10">
          {/* Header Section */}
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-md">
                  <Receipt className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">
                    INVOICE
                  </h1>
                  <p className="text-sm font-medium text-slate-500 tracking-wider">
                    {order.storeCode ? `STORE: ${order.storeCode}` : "OFFICIAL RECEIPT"}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-4xl font-light text-slate-400">
                #{order.orderNumber || "00000"}
              </h2>
              <div className="mt-4 flex flex-col items-end gap-1 text-sm text-slate-600">
                <span className="font-semibold text-slate-800 bg-slate-100 px-3 py-1 rounded-full text-xs tracking-wider uppercase">
                  Status: {order.status || "CONFIRMED"}
                </span>
                <p className="mt-2 text-slate-500">Date Issued: <span className="font-semibold text-slate-800">{datePlaced}</span></p>
              </div>
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-2 gap-8 border-y border-slate-100 py-8">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Billed From</h3>
              <p className="font-bold text-slate-900 text-lg">NextGen Store Ltd.</p>
              <div className="space-y-2 text-sm text-slate-600">
                <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /> 123 Commerce Avenue, Suite 400</p>
                <p className="flex items-center gap-2 text-transparent select-none"><Globe className="h-4 w-4 text-transparent" /> Cityville, State, 10020</p>
                <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /> +1 (555) 123-4567</p>
                <p className="flex items-center gap-2"><Globe className="h-4 w-4 text-slate-400" /> www.nextgenstore.com</p>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Billed To</h3>
              <p className="font-bold text-slate-900 text-lg">Customer Info</p>
              <div className="space-y-2 text-sm text-slate-600">
                <p className="flex items-center gap-2 font-medium"><UserIcon className="h-4 w-4 text-slate-400" /> ID: {order.customerId || "N/A"}</p>
                <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /> customer@example.com</p>
                <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /> Not Provided</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-800">
                  <th className="py-4 px-2 font-bold text-slate-900 text-sm uppercase tracking-wider w-[50%]">
                    Item Description
                  </th>
                  <th className="py-4 px-2 font-bold text-slate-900 text-sm uppercase tracking-wider text-right w-[15%]">
                    Price
                  </th>
                  <th className="py-4 px-2 font-bold text-slate-900 text-sm uppercase tracking-wider text-center w-[15%]">
                    Qty
                  </th>
                  <th className="py-4 px-2 font-bold text-slate-900 text-sm uppercase tracking-wider text-right w-[20%]">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(order.items || []).map((item: any, idx: number) => (
                  <tr key={item.id} className={idx % 2 === 0 ? "bg-slate-50/50" : "bg-white"}>
                    <td className="py-5 px-2">
                      <p className="font-semibold text-slate-900 text-base">
                        Product ID: {item.productId}
                      </p>
                      <p className="text-xs text-slate-500 font-mono mt-1 tracking-wide">
                        SKU: PROD-{item.productId}
                      </p>
                    </td>
                    <td className="py-5 px-2 text-right text-slate-700 font-medium">
                      ${item.unitPrice?.toFixed(2) || "0.00"}
                    </td>
                    <td className="py-5 px-2 text-center text-slate-700 font-medium bg-slate-50/30">
                      {item.quantity}
                    </td>
                    <td className="py-5 px-2 text-right font-bold text-slate-900">
                      ${((item.unitPrice || 0) * (item.quantity || 1)).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {(!order.items || order.items.length === 0) && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 text-center text-slate-400 italic bg-slate-50/50 rounded-b-lg"
                    >
                      No items found in this order.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Section */}
          <div className="flex justify-between items-start pt-6 border-t-2 border-slate-800">
            {/* Notes Section */}
            <div className="w-1/2 pr-10">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Payment Terms</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Payment is due within 30 days of issuance. Please include the invoice number on your check or wire transfer.
              </p>
            </div>
            
            {/* Totals */}
            <div className="w-1/2 bg-slate-50 p-6 rounded-xl border border-slate-100">
              <div className="space-y-4 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-900">
                    ${order.totalAmount?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Discount</span>
                  <span className="font-medium text-red-500">
                    -${order.discount?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax</span>
                  <span className="font-medium text-slate-900">
                    ${order.tax?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 border-b border-slate-200 pb-4">
                  <span>Shipping</span>
                  <span className="font-medium text-slate-900">
                    ${order.shippingCost?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold text-slate-900 text-lg uppercase tracking-wider">
                    Total Due
                  </span>
                  <span className="font-black text-slate-900 text-3xl tracking-tighter">
                    ${order.grandTotal?.toFixed(2) || "0.00"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-10 flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-bold text-sm uppercase tracking-wide">Thank you for your business!</span>
            </div>
            <p className="text-xs text-slate-400 mt-4">
              This is a computer-generated document. No signature is required.
            </p>
          </div>
        </div>
      </div>
    );
  }
);

BillReceipt.displayName = "BillReceipt";

// Simple fallback icon since User isn't exported from lucide by default in my manual list above
const UserIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

export default BillReceipt;
