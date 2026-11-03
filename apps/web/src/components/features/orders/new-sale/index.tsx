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
import { format } from 'date-fns';
import { BadgePercent, Plus, ReceiptText, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toneFor } from '../order-status';
import { InputSelect } from '@/components/common/input-select';

const money = (value?: number | null) => `₹${Number(value ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Same effective-price rule the POS cart uses; the server recomputes from the price history on save.
const unitPriceOf = (variant?: ProductVariantListItemDto) =>
  variant ? Number(variant.isOffer && variant.offerPrice != null ? variant.offerPrice : variant.sellingPrice) || 0 : 0;

export default function NewSale() {
  const router = useRouter();
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const createOrder = useCreateOrder();

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
  const totalQty = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const discount = Number(values.discount) || 0;
  const tax = Number(values.tax) || 0;
  const shipping = Number(values.shippingCost) || 0;
  const grandTotal = subtotal - discount + tax + shipping;
  const tone = toneFor(values.status);

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

        {/* Live invoice preview: same layout language as BillReceipt, but fluid and fed from the form; real prices land on save. */}
        <div className="lg:col-span-5">
          <div className="overflow-hidden rounded-xl border bg-white text-slate-900 shadow-sm lg:sticky lg:top-6">
            <div className="h-1.5 w-full bg-slate-900" />

            <div className="px-6 pb-6 pt-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
                    {config.appName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold leading-tight">{config.appName}</p>
                    <p className="text-[11px] uppercase tracking-wider text-slate-400">Tax Invoice</p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="inline-block rounded-full border border-dashed border-slate-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Preview
                  </span>
                  <p className="mt-1.5 text-xs text-slate-500">{format(new Date(), 'dd MMM yyyy')}</p>
                  <span
                    className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone.soft} ${tone.text}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                    {tone.label}
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bill to</p>
                <p className="mt-1 text-sm font-bold">{customer?.name || 'Walk-in customer'}</p>
                {customer?.email && <p className="text-xs text-slate-600">{customer.email}</p>}
              </div>

              <table className="mt-5 w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="rounded-l-md py-2 pl-3 pr-2 text-[10px] font-bold uppercase tracking-wider">Item</th>
                    <th className="w-20 px-2 py-2 text-right text-[10px] font-bold uppercase tracking-wider">Rate</th>
                    <th className="w-12 px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wider">Qty</th>
                    <th className="w-24 rounded-r-md py-2 pl-2 pr-3 text-right text-[10px] font-bold uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => (
                    <tr key={index} className="border-b border-slate-100 align-top">
                      <td className="py-2.5 pl-3 pr-2">
                        <p className="text-sm font-semibold leading-snug">
                          {line.variant?.name || line.variant?.sku || `Variant #${line.variantId}`}
                        </p>
                        {line.variant?.sku && <p className="mt-0.5 font-mono text-[11px] text-slate-500">{line.variant.sku}</p>}
                      </td>
                      <td className="px-2 py-2.5 text-right text-sm tabular-nums text-slate-600">{money(line.unitPrice)}</td>
                      <td className="px-2 py-2.5 text-center text-sm tabular-nums text-slate-600">{line.quantity}</td>
                      <td className="py-2.5 pl-2 pr-3 text-right text-sm font-semibold tabular-nums">{money(line.amount)}</td>
                    </tr>
                  ))}

                  {lines.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-sm italic text-slate-400">
                        Add a product to see it on the invoice.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="mt-4 space-y-2 rounded-lg border border-slate-200 px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Subtotal {totalQty > 0 ? `(${totalQty} qty)` : ''}</span>
                  <span className="font-semibold tabular-nums">{money(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-500">
                      <BadgePercent className="h-3.5 w-3.5" /> Discount
                    </span>
                    <span className="font-semibold tabular-nums text-rose-600">- {money(discount)}</span>
                  </div>
                )}
                {tax > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Tax</span>
                    <span className="font-semibold tabular-nums">{money(tax)}</span>
                  </div>
                )}
                {shipping > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Shipping &amp; fees</span>
                    <span className="font-semibold tabular-nums">{money(shipping)}</span>
                  </div>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-900 px-4 py-3 text-white">
                <span className="text-[11px] font-bold uppercase tracking-widest">Total</span>
                <span className="text-xl font-bold tabular-nums tracking-tight">{money(grandTotal)}</span>
              </div>

              {values.notes && (
                <div className="mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Notes</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{values.notes}</p>
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-6 py-2.5 text-[10px] text-slate-400">
              Prices shown are indicative; the saved invoice uses the effective price at sale time.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
