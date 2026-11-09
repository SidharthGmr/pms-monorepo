'use client';
import ListPageHeader from '@/components/common/list-page-header';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import config from '@/config';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useCreateOrder } from '@/hooks/service-hooks/useOrderService';
import { useGetAllPublicProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { useGetAllUserList } from '@/hooks/service-hooks/useUserList.service.hook';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';
import { zodResolver } from '@/lib/zod-resolver';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import {
  CreateOrderModel,
  DiscountTypeEnum,
  OrderStatusEnum,
  orderFormFields,
  Roles,
  TaxTypeEnum,
  type OrderFormValues,
  type ProductVariantListItemDto,
} from '@pms/types';
import { useGetAllTaxes } from '@/hooks/service-hooks/useTaxService';
import { Download, Eye, Plus, ReceiptText, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { InputSelect, type InputSelectItem } from '@/components/common/input-select';
import { downloadInvoicePdf } from '../invoice-pdf';
import BillPrintPreview from '../bill-print-preview';
import { downloadTemplateBill } from '../template-bill';
import { useGetMyStore } from '@/hooks/service-hooks/useStoreService';
import { amountInWords } from '@/lib/amount-in-words';
import { cn } from '@/lib/utils';

const money = (value?: number | null) => `₹${Number(value ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const unitPriceOf = (variant?: ProductVariantListItemDto) =>
  variant ? Number(variant.isOffer && variant.wholesalePrice != null ? variant.wholesalePrice : variant.sellingPrice) || 0 : 0;

// The variant's own discount, per unit - the same rule the server applies when pricing the line.
const perUnitDiscount = (variant?: ProductVariantListItemDto) => {
  if (!variant || variant.discountValue == null || variant.discountValue <= 0) return 0;
  const unit = unitPriceOf(variant);
  const discount = variant.discountType === DiscountTypeEnum.Percentage ? (unit * variant.discountValue) / 100 : variant.discountValue;
  return Math.min(Math.max(Math.round(discount * 100) / 100, 0), unit);
};

export default function NewSale() {
  const router = useRouter();
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const createOrder = useCreateOrder();

  // Branding for the downloaded bill lives on the user's own store; the bill itself always
  // renders through the Tax Invoice template.
  const { data: myStoreResponse } = useGetMyStore();
  const myStore = myStoreResponse?.data?.data;
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data: customersResponse } = useGetAllUserList({ role: Roles.USER, showAllRecords: true });
  const customers = useMemo(
    () =>
      (customersResponse?.data?.data?.data || [])
        .map((c) => {
          const cid = ((c as any).userId ?? (c as any).usersId ?? '') as string;
          return { id: cid, name: c.name, email: c.email };
        })
        .filter((c) => c.id),
    [customersResponse]
  );
  const customerOptions = useMemo(() => customers.map((c) => ({ label: c.name, value: c.id })), [customers]);

  const { data: taxesResponse } = useGetAllTaxes({ showAllRecords: true });
  const taxById = useMemo(() => new Map((taxesResponse?.data?.data?.data ?? []).map((tax) => [tax.id, tax])), [taxesResponse]);

  // GST here is tax-inclusive ("With Tax"), so the shown amount is the portion inside the price.
  const lineTaxAmount = (variant: ProductVariantListItemDto | undefined, netAmount: number) => {
    if (!variant || variant.saleTaxType !== TaxTypeEnum.WithTax || !variant.taxId) return 0;
    const rate = taxById.get(variant.taxId)?.rate ?? 0;
    return rate > 0 ? Math.round(((netAmount * rate) / (100 + rate)) * 100) / 100 : 0;
  };

  const { data: variantsResponse } = useGetAllPublicProductVariants({ showAllRecords: true });
  const variants = useMemo(() => variantsResponse?.data?.data?.data || [], [variantsResponse]);
  const variantById = useMemo(() => new Map<number, ProductVariantListItemDto>(variants.map((v) => [v.id, v])), [variants]);
  const productOptions = useMemo<InputSelectItem[]>(
    () =>
      variants.map((v) => ({
        label: v.name ? (v.sku ? `${v.name} (${v.sku})` : v.name) : v.sku,
        value: v.id,
        details: [
          money(unitPriceOf(v)),
          <span key="stock" className={v.stockQuantity <= 0 ? 'text-red-500' : ''}>
            {v.stockQuantity}
          </span>,
        ],
      })),
    [variants]
  );

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormFields),
    defaultValues: {
      customerId: '',
      discount: 0,
      tax: 0,
      shippingCost: 0,
      isInterState: false,
      status: OrderStatusEnum.Confirmed,
      notes: '',
      items: [{ variantId: undefined as any, quantity: 1 }],
    },
  });

  const { control, handleSubmit, watch, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  /**
   * Rows the user never picked an item for are scaffolding, not data - the auto-added trailing
   * row most of all - so they are dropped before validation rather than failing it. When every
   * row is blank one is kept, so the required-variant message still has somewhere to appear.
   */
  const dropBlankRows = () => {
    const items = form.getValues('items') ?? [];
    const blankIndexes = items.map((item, i) => (item.variantId == null || !Number(item.variantId) ? i : -1)).filter((i) => i >= 0);
    if (blankIndexes.length === items.length && blankIndexes.length > 0) blankIndexes.shift();
    for (let k = blankIndexes.length - 1; k >= 0; k--) remove(blankIndexes[k]!);
  };

  useUnsavedChangesWarning(formState.isDirty && !createOrder.isSuccess);

  // Everything the invoice preview shows is derived live from the form values.
  const values = watch();
  const customer = customers.find((c) => c.id === values.customerId);
  // The customer box allows free text, so an unmatched value is a typed walk-in name for the bill.
  const billCustomerName = customer?.name || String(values.customerId ?? '').trim() || 'Walk-in customer';
  const lines = (values.items ?? [])
    .filter((it) => it.variantId != null && it.variantId !== ('' as any))
    .map((it) => {
      const variantId = Number(it.variantId);
      const variant = variantById.get(variantId);
      const quantity = Number(it.quantity) || 0;
      const unitPrice = unitPriceOf(variant);
      const netUnitPrice = unitPrice - perUnitDiscount(variant);
      const discountAmount = perUnitDiscount(variant) * quantity;
      const amount = netUnitPrice * quantity;
      const taxAmount = lineTaxAmount(variant, amount);
      return { variantId, variant, quantity, unitPrice, netUnitPrice, discountAmount, taxAmount, amount };
    });
  // The discount field holds a percentage; prices are tax-inclusive, so GST is informational.
  const totalQty = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const itemDiscountTotal = lines.reduce((sum, line) => sum + line.discountAmount, 0);
  const itemTaxTotal = Math.round(lines.reduce((sum, line) => sum + line.taxAmount, 0) * 100) / 100;
  const grossSubtotal = subtotal + itemDiscountTotal;
  const discountPercent = Math.min(Math.max(Number(values.discount) || 0, 0), 100);
  const additionalDiscount = Math.round(subtotal * discountPercent) / 100;
  const shipping = Number(values.shippingCost) || 0;
  const grandTotal = subtotal - additionalDiscount + shipping;

  // The sale as the Tax Invoice template's data shape, shared by download and preview.
  const buildBillInvoice = () => ({
    number: 'PREVIEW',
    status: 'CONFIRMED' as const,
    issuedAt: new Date(),
    store: {
      name: myStore?.siteName || myStore?.name || config.appName,
      code: myStore?.code ?? '',
      address: '',
      phone: myStore?.phone ?? '',
      email: myStore?.email ?? '',
      gstin: myStore?.gstin ?? undefined,
    },
    customer: { name: billCustomerName, address: '', phone: '', email: customer?.email ?? '' },
    isInterState: values.isInterState === true,
    items: lines.map((line) => ({
      name: line.variant?.product?.name || line.variant?.name || `Variant #${line.variantId}`,
      variant: line.variant?.name ?? undefined,
      sku: line.variant?.sku ?? undefined,
      hsn: line.variant?.product?.hsnCode ?? undefined,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      discount: line.discountAmount || undefined,
      tax: line.taxAmount || undefined,
    })),
    discount: additionalDiscount,
    // Prices are GST-inclusive: the exact amount is shown, never added to the total.
    taxRate: 0,
    taxAmount: itemTaxTotal,
    taxIncluded: true,
    shipping,
    received: 0,
    payment: { method: '—', status: 'Pending' },
    notes: values.notes || 'Payment and received amount are recorded on the order after the sale.',
  });

  const downloadBillPdf = async () => {
    setIsDownloading(true);
    try {
      // The bill renders through the Tax Invoice template, carrying this sale's data.
      await downloadTemplateBill(buildBillInvoice(), myStore?.storeLogo ?? undefined, `bill-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch {
      // The drawn jsPDF bill stays as the fallback if template rendering fails.
      await downloadInvoicePdf(
        {
          orderNumber: 'PREVIEW',
          status: values.status,
          createdAt: new Date().toISOString(),
          totalAmount: grossSubtotal,
          discount: itemDiscountTotal + additionalDiscount,
          tax: itemTaxTotal,
          shippingCost: shipping,
          grandTotal,
          notes: values.notes || null,
          items: lines.map((line) => ({
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            product: { name: line.variant?.product?.name || line.variant?.name || `Variant #${line.variantId}` },
            variant: { name: line.variant?.name, sku: line.variant?.sku },
          })),
          store: { name: myStore?.siteName || myStore?.name || config.appName },
          customer: { name: billCustomerName, email: customer?.email },
          payments: [],
        },
        myStore?.storeLogo ?? undefined
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const submitData = async (model: OrderFormValues) => {
    // The form's discount is a percentage; the API takes the amount. GST is recomputed
    // server-side from the ledger, so the tax sent here is informational.
    const payload: CreateOrderModel = {
      customerId: model.customerId,
      discount: additionalDiscount,
      tax: itemTaxTotal,
      shippingCost: model.shippingCost,
      isInterState: model.isInterState === true,
      status: model.status,
      notes: model.notes,
      items: (model.items ?? []).map((it) => ({ variantId: Number(it.variantId), quantity: Number(it.quantity) })),
    };

    const response = await createOrder.mutateAsync(payload);

    if (response && (response.status === 200 || response.status === 201)) {
      toast({ variant: 'success', title: 'Sale completed successfully' });
      const placedOrder = response.data?.data;
      router.push(placedOrder?.orderNumber ? `/admin/orders/${placedOrder.orderNumber}` : '/admin/orders');
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <ListPageHeader icon={ReceiptText} title="New Sale" description="Bill a sale and preview the invoice as you type" backHref="/admin/orders" />

      <div>
        <Form {...form}>
          <form
            autoComplete="off"
            onSubmit={(event) => {
              dropBlankRows();
              void handleSubmit(submitData)(event);
            }}
            className="space-y-4 rounded-xl border bg-card p-4 sm:p-5"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <InputSelect
                        placeholder="Select a customer"
                        items={customerOptions}
                        value={field.value ?? ''}
                        valueType="string"
                        containerName="new-sale-customer"
                        onChange={(value) => field.onChange(value ? String(value) : '')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/60 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <th className="w-8 px-2 py-2 text-left font-semibold">#</th>
                      <th className="px-2 py-2 text-left font-semibold">Item</th>
                      <th className="w-20 px-2 py-2 text-right font-semibold">Qty</th>
                      <th className="w-28 px-2 py-2 text-right font-semibold">Price/Unit</th>
                      <th className="w-24 px-2 py-2 text-right font-semibold">Discount</th>
                      <th className="w-24 px-2 py-2 text-right font-semibold">Tax</th>
                      <th className="w-28 px-2 py-2 text-right font-semibold">Amount</th>
                      <th className="w-10 px-1 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((f, index) => {
                      const line = (() => {
                        const variant = variantById.get(Number(values.items?.[index]?.variantId));
                        const quantity = Number(values.items?.[index]?.quantity) || 0;
                        const unitPrice = unitPriceOf(variant);
                        const discountAmount = perUnitDiscount(variant) * quantity;
                        const amount = (unitPrice - perUnitDiscount(variant)) * quantity;
                        const taxAmount = lineTaxAmount(variant, amount);
                        return { variant, unitPrice, discountAmount, taxAmount, amount };
                      })();

                      return (
                        <tr key={f.id} className="border-b align-top last:border-b-0">
                          <td className="px-2 py-3 text-xs tabular-nums text-muted-foreground">{index + 1}</td>
                          <td className="px-1 py-1.5">
                            <FormField
                              control={control}
                              name={`items.${index}.variantId`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <InputSelect
                                      placeholder="Type or select an item"
                                      items={productOptions}
                                      detailHeaders={['Price', 'Stock']}
                                      contentClass="w-[460px]"
                                      inputClass="h-9"
                                      allowCustomValue={false}
                                      value={field.value ?? ''}
                                      valueType="number"
                                      containerName={`new-sale-product-${index}`}
                                      onChange={(value) => {
                                        field.onChange(value === '' ? undefined : Number(value));
                                        // Filling the last row grows the table by itself; no
                                        // focus steal, or the quantity could not be typed next.
                                        if (value !== '' && index === (form.getValues('items')?.length ?? 0) - 1) {
                                          append({ variantId: undefined as any, quantity: 1 }, { shouldFocus: false });
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <FormField
                              control={control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={1}
                                      placeholder="1"
                                      className="h-9 text-right"
                                      value={field.value ?? ''}
                                      onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="px-2 py-3 text-right text-xs tabular-nums text-muted-foreground">
                            {line.variant ? money(line.unitPrice) : '—'}
                          </td>
                          <td className="px-2 py-3 text-right text-xs tabular-nums text-emerald-700 dark:text-emerald-400">
                            {line.variant && line.discountAmount > 0 ? `−${money(line.discountAmount)}` : '—'}
                          </td>
                          <td className="px-2 py-3 text-right text-xs tabular-nums text-muted-foreground">
                            {line.variant && line.taxAmount > 0 ? money(line.taxAmount) : '—'}
                          </td>
                          <td className="px-2 py-3 text-right text-xs font-semibold tabular-nums">{line.variant ? money(line.amount) : '—'}</td>
                          <td className="px-1 py-1.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 shrink-0 text-slate-400 hover:text-red-500"
                              onClick={() => fields.length > 1 && remove(index)}
                              disabled={fields.length <= 1}
                              title="Remove row"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td colSpan={8} className="p-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          icon={Plus}
                          iconPlacement="left"
                          onClick={() => append({ variantId: undefined as any, quantity: 1 })}
                        >
                          Add Row
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/40">
                      <td className="px-2 py-2" />
                      <td className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total</td>
                      <td className="px-2 py-2 text-right text-sm font-semibold tabular-nums">{totalQty || ''}</td>
                      <td />
                      <td className="px-2 py-2 text-right text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                        {itemDiscountTotal > 0 ? `−${money(itemDiscountTotal)}` : ''}
                      </td>
                      <td className="px-2 py-2 text-right text-xs font-semibold tabular-nums text-muted-foreground">
                        {itemTaxTotal > 0 ? money(itemTaxTotal) : ''}
                      </td>
                      <td className="px-2 py-2 text-right text-sm font-bold tabular-nums">{money(subtotal)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {(itemDiscountTotal > 0 || itemTaxTotal > 0) && (
                <p className="text-[11px] text-muted-foreground">
                  Item discounts are already applied to Amount; Tax is the GST included in tax-inclusive prices.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-4">
                <div>
                  <FormField
                    control={control}
                    name="discount"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between gap-3 space-y-0 border-t py-1.5">
                        <FormLabel className="text-sm font-normal text-muted-foreground">Additional discount (%)</FormLabel>
                        <div>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step="0.01"
                              placeholder="0"
                              className={cn('h-8 w-32 text-right tabular-nums', discountPercent > 0 && 'text-rose-600 dark:text-rose-400')}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="shippingCost"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between gap-3 space-y-0 py-1.5">
                        <FormLabel className="text-sm font-normal text-muted-foreground">Shipping &amp; fees</FormLabel>
                        <div>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              placeholder="0"
                              className="h-8 w-32 text-right tabular-nums"
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="isInterState"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between gap-3 space-y-0 py-1.5">
                        <FormLabel className="text-sm font-normal text-muted-foreground">Inter-state supply (IGST)</FormLabel>
                        <FormControl>
                          <Switch checked={field.value === true} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Sale notes" rows={2} className="h-full min-h-24 resize-none" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold tabular-nums">{money(grossSubtotal)}</span>
                </div>

                {itemDiscountTotal > 0 && (
                  <div className="flex items-center justify-between py-1.5 text-sm">
                    <span className="text-muted-foreground">Discount (incl. in price)</span>
                    <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">−{money(itemDiscountTotal)}</span>
                  </div>
                )}
                {additionalDiscount > 0 && (
                  <div className="flex items-center justify-between py-1.5 text-sm">
                    <span className="text-muted-foreground">Additional discount ({discountPercent}%)</span>
                    <span className="font-semibold tabular-nums text-rose-600 dark:text-rose-400">−{money(additionalDiscount)}</span>
                  </div>
                )}
                {itemTaxTotal > 0 && (
                  <div className="flex items-center justify-between py-1.5 text-sm">
                    <span className="text-muted-foreground">GST (incl. in price)</span>
                    <span className="font-semibold tabular-nums text-muted-foreground">{money(itemTaxTotal)}</span>
                  </div>
                )}
                {shipping > 0 && (
                  <div className="flex items-center justify-between py-1.5 text-sm">
                    <span className="text-muted-foreground">Shipping &amp; fees</span>
                    <span className="font-semibold tabular-nums">{money(shipping)}</span>
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between rounded-md bg-primary px-3 py-2.5 text-primary-foreground">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total payable</span>
                  <span className="text-lg font-bold tabular-nums">{money(grandTotal)}</span>
                </div>
                <div className="rounded-lg border border-dashed px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Amount in words</p>
                  <p className="mt-1 text-xs font-medium italic leading-relaxed text-muted-foreground">{amountInWords(grandTotal)}</p>
                </div>
                <p className="mt-1.5 text-[10px] text-muted-foreground">Payment and received amount are recorded on the order after the sale.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                icon={Eye}
                iconPlacement="left"
                disabled={lines.length === 0}
                onClick={() => setIsPreviewOpen(true)}
              >
                Preview Bill
              </Button>
              <Button
                type="button"
                variant="outline"
                icon={Download}
                iconPlacement="left"
                loading={isDownloading}
                disabled={lines.length === 0 || isDownloading}
                onClick={() => void downloadBillPdf()}
              >
                Download Bill PDF
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/admin/orders')}>
                Cancel
              </Button>
              <Button type="submit" loading={createOrder.isPending}>
                Complete Sale
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <BillPrintPreview
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        invoice={isPreviewOpen ? buildBillInvoice() : null}
        logoUrl={myStore?.storeLogo ?? undefined}
        fileName={`bill-${new Date().toISOString().slice(0, 10)}.pdf`}
      />
    </div>
  );
}
