'use client';
import ListPageHeader from '@/components/common/list-page-header';
import { SelectSearch } from '@/components/common/select-search';
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
import { Plus, ReceiptText, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { InputSelect } from '@/components/common/input-select';
import ClassicTemplate from '@/components/features/settings/invoice-templates/classic';
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
  const productOptions = useMemo(
    () => variants.map((v) => ({ label: v.name ? (v.sku ? `${v.name} (${v.sku})` : v.name) : v.sku, value: v.id })),
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
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const discount = Number(values.discount) || 0;
  const tax = Number(values.tax) || 0;
  const shipping = Number(values.shippingCost) || 0;

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
                <div className="flex items-center justify-between">
                  <FormLabel>Products *</FormLabel>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    icon={Plus}
                    iconPlacement="left"
                    className="h-auto p-0 text-xs font-medium"
                    onClick={() => append({ variantId: undefined as any, quantity: 1 })}
                  >
                    Add Product
                  </Button>
                </div>

                <div className="space-y-2 rounded-lg border p-3">
                  {fields.map((f, index) => {
                    const line = (() => {
                      const variant = variantById.get(Number(values.items?.[index]?.variantId));
                      const quantity = Number(values.items?.[index]?.quantity) || 0;
                      const unitPrice = unitPriceOf(variant);
                      return { variant, unitPrice, amount: unitPrice * quantity };
                    })();

                    return (
                      <div key={f.id} className="space-y-1">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <FormField
                              control={control}
                              name={`items.${index}.variantId`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <SelectSearch
                                      buttonClass="w-full h-10 font-normal"
                                      placeholder="Select a variant"
                                      items={productOptions}
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
                          </div>
                          <div className="w-24">
                            <FormField
                              control={control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={1}
                                      placeholder="Qty"
                                      value={field.value ?? ''}
                                      onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={`h-10 w-10 shrink-0 text-slate-400 hover:text-red-500 ${fields.length <= 1 ? 'cursor-not-allowed opacity-30' : ''}`}
                            onClick={() => fields.length > 1 && remove(index)}
                            disabled={fields.length <= 1}
                            title="Remove product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {line.variant && (
                          <p className="px-1 text-right text-xs tabular-nums text-muted-foreground">
                            {money(line.unitPrice)} each · {money(line.amount)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
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
