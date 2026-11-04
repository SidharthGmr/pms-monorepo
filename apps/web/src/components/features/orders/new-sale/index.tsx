'use client';
import ListPageHeader from '@/components/common/list-page-header';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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
import { CreateOrderModel, OrderStatusEnum, orderFormFields, Roles, type OrderFormValues, type ProductVariantListItemDto } from '@pms/types';
import { Download, Plus, ReceiptText, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { InputSelect, type InputSelectItem } from '@/components/common/input-select';
import ClassicTemplate from '@/components/features/settings/invoice-templates/classic';
import { downloadInvoicePdf } from '../invoice-pdf';
import { type SampleInvoice } from '@/components/features/settings/invoice-templates/sample-data';
import { useGetSettings } from '@/hooks/service-hooks/useSettingService';

const money = (value?: number | null) => `₹${Number(value ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Same effective-price rule the POS cart uses; the server recomputes from the price history on save.
const unitPriceOf = (variant?: ProductVariantListItemDto) =>
  variant ? Number(variant.isOffer && variant.offerPrice != null ? variant.offerPrice : variant.sellingPrice) || 0 : 0;

export default function NewSale() {
  const router = useRouter();
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const createOrder = useCreateOrder();

  // Branding for the invoice preview, and a zoom factor that fits the 794px sheet to the column.
  const { data: settingsResponse } = useGetSettings();
  const settings = settingsResponse?.data?.data;
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewZoom, setPreviewZoom] = useState(0.6);
  const [isDownloading, setIsDownloading] = useState(false);
  useEffect(() => {
    const element = previewRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setPreviewZoom(Math.min(1, element.clientWidth / 794)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const { data: customersResponse } = useGetAllUserList({ role: Roles.USER, showAllRecords: true });
  const customers = useMemo(
    () =>
      (customersResponse?.data?.data?.data || [])
        .map((c) => {
          // API returns the GUID under `userId`; the DTO mislabels it `usersId`.
          const cid = ((c as any).userId ?? (c as any).usersId ?? '') as string;
          return { id: cid, name: c.name, email: c.email };
        })
        .filter((c) => c.id),
    [customersResponse]
  );
  const customerOptions = useMemo(() => customers.map((c) => ({ label: c.email ? `${c.name} (${c.email})` : c.name, value: c.id })), [customers]);

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
      status: OrderStatusEnum.Confirmed,
      notes: '',
      items: [{ variantId: undefined as any, quantity: 1 }],
    },
  });

  const { control, handleSubmit, watch, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  useUnsavedChangesWarning(formState.isDirty && !createOrder.isSuccess);

  // Everything the invoice preview shows is derived live from the form values.
  const values = watch();
  const customer = customers.find((c) => c.id === values.customerId);
  const lines = (values.items ?? [])
    .filter((it) => it.variantId != null && it.variantId !== ('' as any))
    .map((it) => {
      const variantId = Number(it.variantId);
      const variant = variantById.get(variantId);
      const quantity = Number(it.quantity) || 0;
      const unitPrice = unitPriceOf(variant);
      return { variantId, variant, quantity, unitPrice, amount: unitPrice * quantity };
    });
  const totalQty = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const discount = Number(values.discount) || 0;
  const tax = Number(values.tax) || 0;
  const shipping = Number(values.shippingCost) || 0;
  const grandTotal = subtotal - discount + tax + shipping;

  // The Classic template computes tax from a rate, so the entered absolute tax is converted back.
  const taxable = subtotal - discount;
  const previewInvoice: SampleInvoice = {
    number: 'PREVIEW',
    status: (['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED'] as const).find((s) => s === values.status) ?? 'CONFIRMED',
    issuedAt: new Date(),
    store: { name: settings?.siteName || config.appName, code: '', address: '', phone: '', email: '' },
    customer: { name: customer?.name || 'Walk-in customer', address: '', phone: '', email: customer?.email || '' },
    items: lines.map((line) => ({
      name: line.variant?.product?.name || line.variant?.name || line.variant?.sku || `Variant #${line.variantId}`,
      variant: [line.variant?.name, line.variant?.sku].filter(Boolean).join(' · ') || undefined,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
    })),
    discount,
    taxRate: taxable > 0 ? tax / taxable : 0,
    shipping,
    received: 0,
    payment: { method: '—', status: 'Due' },
    notes: values.notes || '',
  };

  const downloadBillPdf = async () => {
    setIsDownloading(true);
    try {
      await downloadInvoicePdf(
        {
          orderNumber: 'PREVIEW',
          status: values.status,
          createdAt: new Date().toISOString(),
          totalAmount: subtotal,
          discount,
          tax,
          shippingCost: shipping,
          grandTotal,
          notes: values.notes || null,
          items: lines.map((line) => ({
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            product: { name: line.variant?.product?.name || line.variant?.name || `Variant #${line.variantId}` },
            variant: { name: line.variant?.name, sku: line.variant?.sku },
          })),
          store: { name: settings?.siteName || config.appName },
          customer: { name: customer?.name || 'Walk-in customer', email: customer?.email },
          payments: [],
        },
        settings?.logoUrl
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const submitData = async (model: OrderFormValues) => {
    const payload: CreateOrderModel = {
      customerId: model.customerId,
      discount: model.discount,
      tax: model.tax,
      shippingCost: model.shippingCost,
      status: model.status,
      notes: model.notes,
      items: (model.items ?? []).map((it) => ({ variantId: Number(it.variantId), quantity: Number(it.quantity) })),
    };

    const response = await createOrder.mutateAsync(payload);

    if (response && (response.status === 200 || response.status === 201)) {
      toast({ variant: 'success', title: 'Sale completed successfully' });
      const orderId = response.data?.data?.id;
      router.push(orderId ? `/admin/orders/${orderId}` : '/admin/orders');
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <ListPageHeader icon={ReceiptText} title="New Sale" description="Bill a sale and preview the invoice as you type" backHref="/admin/orders" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Form {...form}>
            <form autoComplete="off" onSubmit={handleSubmit(submitData)} className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer *</FormLabel>
                      <FormControl>
                        <InputSelect
                          placeholder="Select a customer"
                          items={customerOptions}
                          value={field.value ?? ''}
                          valueType="string"
                          containerName="new-sale-customer"
                          onChange={(value) => field.onChange(value ? String(value) : '')}
                        />
                        {/* <SelectSearch
                          buttonClass="w-full"
                          placeholder="Select a customer"
                          items={customerOptions}
                          value={field.value ?? ''}
                          valueType="string"
                          containerName="new-sale-customer"
                          onChange={(value) => field.onChange(value ? String(value) : '')}
                        /> */}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* <FormField
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <SelectSearch
                          buttonClass="w-full"
                          placeholder="Select Status"
                          disableSearch={true}
                          items={Object.values(OrderStatusEnum).map((s) => ({ label: s.charAt(0) + s.slice(1).toLowerCase(), value: s }))}
                          value={field.value ?? ''}
                          valueType="string"
                          containerName="new-sale-status"
                          onChange={(value) => field.onChange(value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}
              </div>

              <div className="space-y-2">
                <FormLabel>Products *</FormLabel>

                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/60 text-[10px] uppercase tracking-wider text-muted-foreground">
                        <th className="w-8 px-2 py-2 text-left font-semibold">#</th>
                        <th className="px-2 py-2 text-left font-semibold">Item</th>
                        <th className="w-20 px-2 py-2 text-right font-semibold">Qty</th>
                        <th className="w-28 px-2 py-2 text-right font-semibold">Price/Unit</th>
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
                          return { variant, unitPrice, amount: unitPrice * quantity };
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
                                        onChange={(value) => field.onChange(value === '' ? undefined : Number(value))}
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
                            <td className="px-2 py-3 text-right text-xs tabular-nums text-muted-foreground">{line.variant ? money(line.unitPrice) : '—'}</td>
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
                    </tbody>
                    <tfoot>
                      <tr className="border-t bg-muted/40">
                        <td className="px-2 py-2" />
                        <td className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total</td>
                        <td className="px-2 py-2 text-right text-sm font-semibold tabular-nums">{totalQty || ''}</td>
                        <td />
                        <td className="px-2 py-2 text-right text-sm font-bold tabular-nums">{money(subtotal)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>

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
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="tax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="shippingCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping Cost</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Sale notes" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2">
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

        {/* Live preview rendered with the real Classic invoice template, zoomed to fit the column; real prices land on save. */}
        <div className="lg:col-span-5">
          <div ref={previewRef} className="overflow-hidden rounded-xl border bg-white shadow-sm lg:sticky lg:top-6">
            <div style={{ zoom: previewZoom }}>
              <ClassicTemplate invoice={previewInvoice} logoUrl={settings?.logoUrl} />
            </div>
            <div className="border-t bg-slate-50 px-6 py-2.5 text-[10px] text-slate-400">
              Preview only - prices shown are indicative; the saved invoice uses the effective price at sale time.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
