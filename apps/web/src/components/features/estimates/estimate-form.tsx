'use client';
import ListPageHeader from '@/components/common/list-page-header';
import { InputSelect, type InputSelectItem } from '@/components/common/input-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useCreateEstimate, useGetEstimateById, useUpdateEstimate } from '@/hooks/service-hooks/useEstimateService';
import { useGetAllPublicProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { useGetAllTaxes } from '@/hooks/service-hooks/useTaxService';
import { useGetAllUserList } from '@/hooks/service-hooks/useUserList.service.hook';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';
import { amountInWords } from '@/lib/amount-in-words';
import { formatPrice } from '@/lib/format-price';
import { zodResolver } from '@/lib/zod-resolver';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import {
  computeEstimateTotals,
  DiscountTypeEnum,
  estimateFields,
  EstimateDto,
  EstimateLineInput,
  EstimateModel,
  EstimateStatusEnum,
  Roles,
  TaxCategoryEnum,
  TaxTypeEnum,
  type EstimateFormValues,
  type ProductVariantListItemDto,
} from '@pms/types';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

const toDateInput = (value: Date | string) => new Date(value).toISOString().slice(0, 10);
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86400000);

const unitPriceOf = (variant?: ProductVariantListItemDto) =>
  variant ? Number(variant.isOffer && variant.wholesalePrice != null ? variant.wholesalePrice : variant.sellingPrice) || 0 : 0;

// The variant's own ledger discount, per unit - the same default the server applies.
const perUnitDiscount = (variant?: ProductVariantListItemDto) => {
  if (!variant || variant.discountValue == null || variant.discountValue <= 0) return 0;
  const unit = unitPriceOf(variant);
  const discount = variant.discountType === DiscountTypeEnum.Percentage ? (unit * variant.discountValue) / 100 : variant.discountValue;
  return Math.min(Math.max(Math.round(discount * 100) / 100, 0), unit);
};

const DISCOUNT_TYPE_OPTIONS: InputSelectItem[] = [
  { label: '%', value: DiscountTypeEnum.Percentage },
  { label: '₹', value: DiscountTypeEnum.Flat },
];

const mapDtoToForm = (estimate: EstimateDto): EstimateFormValues => ({
  customerId: estimate.customerId ?? '',
  customerName: estimate.customerName,
  customerPhone: estimate.customerPhone ?? '',
  customerEmail: estimate.customerEmail ?? '',
  billingAddress: estimate.billingAddress ?? '',
  shippingAddress: estimate.shippingAddress ?? '',
  estimateDate: toDateInput(estimate.estimateDate),
  validUntil: estimate.validUntil ? toDateInput(estimate.validUntil) : '',
  referenceNumber: estimate.referenceNumber ?? '',
  notes: estimate.notes ?? '',
  terms: estimate.terms ?? '',
  additionalDiscountType: estimate.additionalDiscountType ?? DiscountTypeEnum.Percentage,
  additionalDiscountValue: estimate.additionalDiscountValue ?? undefined,
  shippingCharges: estimate.shippingCharges || undefined,
  adjustment: estimate.adjustment || undefined,
  isInterState: estimate.isInterState,
  items: (estimate.items ?? []).map((item) => ({
    variantId: item.variantId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discountType: item.discountType ?? DiscountTypeEnum.Percentage,
    discountValue: item.discountValue ?? undefined,
    taxId: item.taxId ?? '',
  })),
});

interface EstimateFormProps {
  id?: number;
}

export default function EstimateForm({ id }: EstimateFormProps) {
  const isEdit = !!id && id > 0;
  const router = useRouter();
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const createEstimate = useCreateEstimate();
  const updateEstimate = useUpdateEstimate();
  const getResponse = useGetEstimateById(id ?? 0, isEdit);
  const existing = getResponse.data?.data?.data;

  const { data: customersResponse } = useGetAllUserList({ role: Roles.USER, showAllRecords: true });
  const customers = useMemo(
    () =>
      (customersResponse?.data?.data?.data || [])
        .map((c) => ({
          id: ((c as { userId?: string }).userId ?? '') as string,
          name: c.name,
          email: c.email ?? '',
          phone: ((c as { phone?: string | null }).phone ?? '') as string,
        }))
        .filter((c) => c.id),
    [customersResponse]
  );
  const customerOptions = useMemo(() => customers.map((c) => ({ label: c.name, value: c.id })), [customers]);

  const { data: taxesResponse } = useGetAllTaxes({ showAllRecords: true });
  const taxes = useMemo(() => taxesResponse?.data?.data?.data ?? [], [taxesResponse]);
  const taxById = useMemo(() => new Map(taxes.map((tax) => [tax.id, tax])), [taxes]);
  const taxOptions = useMemo<InputSelectItem[]>(
    () => [{ label: 'No tax', value: '' }, ...taxes.map((tax) => ({ label: `${tax.name} · ${tax.rate}%`, value: tax.id }))],
    [taxes]
  );

  const { data: variantsResponse } = useGetAllPublicProductVariants({ showAllRecords: true });
  const variants = useMemo(() => variantsResponse?.data?.data?.data || [], [variantsResponse]);
  const variantById = useMemo(() => new Map<number, ProductVariantListItemDto>(variants.map((v) => [v.id, v])), [variants]);
  const productOptions = useMemo<InputSelectItem[]>(
    () =>
      variants.map((v) => ({
        label: v.name ? (v.sku ? `${v.name} (${v.sku})` : v.name) : v.sku,
        value: v.id,
        details: [formatPrice(unitPriceOf(v)), String(v.stockQuantity)],
      })),
    [variants]
  );

  const today = useMemo(() => new Date(), []);
  const form = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateFields),
    defaultValues: {
      customerId: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      billingAddress: '',
      shippingAddress: '',
      estimateDate: toDateInput(today),
      validUntil: toDateInput(addDays(today, 30)),
      referenceNumber: '',
      notes: '',
      terms: '',
      additionalDiscountType: DiscountTypeEnum.Percentage,
      additionalDiscountValue: undefined,
      shippingCharges: undefined,
      adjustment: undefined,
      isInterState: false,
      items: [{ variantId: undefined as unknown as number, quantity: 1, discountType: DiscountTypeEnum.Percentage, taxId: '' }],
    },
  });

  const { control, handleSubmit, watch, setValue, reset, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  // The fetched draft arrives after mount, so the form is seeded once it lands.
  useEffect(() => {
    if (isEdit && existing) reset(mapDtoToForm(existing));
  }, [isEdit, existing, reset]);

  const [saved, setSaved] = useState(false);
  useUnsavedChangesWarning(formState.isDirty && !saved);

  const values = watch();

  // The same pipeline the server runs, so the preview and the saved totals agree to the paisa.
  const taxRateOf = (taxId?: string | null) => {
    const tax = taxId ? taxById.get(taxId) : undefined;
    return tax && tax.category === TaxCategoryEnum.Taxable ? Number(tax.rate) : 0;
  };
  const lineInputs: EstimateLineInput[] = (values.items ?? [])
    .filter((item) => item.variantId != null && !Number.isNaN(Number(item.variantId)))
    .map((item) => {
      const variant = variantById.get(Number(item.variantId));
      const rate = taxRateOf(item.taxId);
      return {
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
        discountType: item.discountType ?? null,
        discountValue: item.discountValue != null && item.discountValue > 0 ? Number(item.discountValue) : null,
        taxRate: rate,
        taxType: variant?.saleTaxType ?? (rate > 0 ? TaxTypeEnum.WithTax : null),
      };
    });
  const totals = computeEstimateTotals(lineInputs, {
    additionalDiscountType: values.additionalDiscountType ?? null,
    additionalDiscountValue: values.additionalDiscountValue != null && values.additionalDiscountValue > 0 ? Number(values.additionalDiscountValue) : null,
    shippingCharges: Number(values.shippingCharges) || 0,
    adjustment: Number(values.adjustment) || 0,
    isInterState: values.isInterState === true,
  });

  const selectCustomer = (customerId: string) => {
    setValue('customerId', customerId, { shouldDirty: true });
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setValue('customerName', customer.name, { shouldDirty: true });
      setValue('customerPhone', customer.phone, { shouldDirty: true });
      setValue('customerEmail', customer.email, { shouldDirty: true });
    }
  };

  const selectVariant = (index: number, variantId: number | undefined) => {
    setValue(`items.${index}.variantId`, variantId as unknown as number, { shouldDirty: true });
    const variant = variantId != null ? variantById.get(variantId) : undefined;
    if (variant) {
      const charged = Math.round((unitPriceOf(variant) - perUnitDiscount(variant)) * 100) / 100;
      setValue(`items.${index}.unitPrice`, charged, { shouldDirty: true });
      setValue(`items.${index}.taxId`, variant.taxId ?? '', { shouldDirty: true });
    }
  };

  const buildModel = (model: EstimateFormValues, status?: 'DRAFT' | 'SENT'): EstimateModel => ({
    customerId: model.customerId || null,
    customerName: model.customerName,
    customerPhone: model.customerPhone || null,
    customerEmail: model.customerEmail || null,
    billingAddress: model.billingAddress || null,
    shippingAddress: model.shippingAddress || null,
    estimateDate: model.estimateDate || undefined,
    validUntil: model.validUntil || null,
    referenceNumber: model.referenceNumber || null,
    notes: model.notes || null,
    terms: model.terms || null,
    additionalDiscountType: model.additionalDiscountType ?? null,
    additionalDiscountValue: model.additionalDiscountValue ?? null,
    shippingCharges: model.shippingCharges ?? 0,
    adjustment: model.adjustment ?? 0,
    isInterState: model.isInterState === true,
    ...(status && { status }),
    items: (model.items ?? []).map((item) => ({
      variantId: Number(item.variantId),
      quantity: Number(item.quantity),
      unitPrice: item.unitPrice ?? null,
      discountType: item.discountType ?? null,
      discountValue: item.discountValue ?? null,
      taxId: item.taxId || null,
    })),
  });

  const submitData = async (model: EstimateFormValues, status: 'DRAFT' | 'SENT') => {
    const response = isEdit
      ? await updateEstimate.mutateAsync({ id: id!, model: buildModel(model) })
      : await createEstimate.mutateAsync(buildModel(model, status));

    if (response && (response.status === 200 || response.status === 201)) {
      setSaved(true);
      toast({ variant: 'success', title: isEdit ? 'Estimate updated successfully' : 'Estimate created successfully' });
      const estimateId = response.data?.data?.id ?? id;
      router.push(estimateId ? `/admin/estimates/${estimateId}` : '/admin/estimates');
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  };

  const isSaving = createEstimate.isPending || updateEstimate.isPending;

  if (isEdit && getResponse.isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (isEdit && (getResponse.isError || (existing && existing.status !== EstimateStatusEnum.Draft))) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <ListPageHeader icon={FileText} title="Edit Estimate" description="Only draft estimates can be edited" backHref="/admin/estimates" />
        <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          {getResponse.isError ? 'This estimate could not be loaded.' : 'This estimate is no longer a draft, so it can no longer be edited.'}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <ListPageHeader
        icon={FileText}
        title={isEdit ? `Edit ${existing?.estimateNumber ?? 'Estimate'}` : 'New Estimate'}
        description="Quote products to a customer — stock and payments are untouched until it converts to an order"
        backHref={isEdit && id ? `/admin/estimates/${id}` : '/admin/estimates'}
      />

      <Form {...form}>
        <form autoComplete="off" onSubmit={(e) => e.preventDefault()} className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormItem>
              <FormLabel>Existing customer</FormLabel>
              <InputSelect
                placeholder="Pick to prefill the details below"
                items={customerOptions}
                value={values.customerId ?? ''}
                valueType="string"
                containerName="estimate-customer"
                onChange={(value) => selectCustomer(value ? String(value) : '')}
              />
            </FormItem>
            <FormField
              control={control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Who is this quote for?" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="customerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="customerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="billingAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billing address</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Billing address" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="shippingAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping address</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Shipping address" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField
              control={control}
              name="estimateDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimate date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="validUntil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valid until</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference no.</FormLabel>
                  <FormControl>
                    <Input placeholder="PO / enquiry reference" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b bg-muted/60 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="w-8 px-2 py-2 text-left font-semibold">#</th>
                  <th className="px-2 py-2 text-left font-semibold">Item</th>
                  <th className="w-20 px-2 py-2 text-right font-semibold">Qty</th>
                  <th className="w-28 px-2 py-2 text-right font-semibold">Price/Unit</th>
                  <th className="w-36 px-2 py-2 text-right font-semibold">Discount</th>
                  <th className="w-40 px-2 py-2 text-left font-semibold">Tax</th>
                  <th className="w-28 px-2 py-2 text-right font-semibold">Amount</th>
                  <th className="w-10 px-1 py-2" />
                </tr>
              </thead>
              <tbody>
                {fields.map((f, index) => {
                  const item = values.items?.[index];
                  const variant = variantById.get(Number(item?.variantId));
                  const rate = taxRateOf(item?.taxId);
                  const line =
                    item && variant
                      ? computeEstimateTotals(
                          [
                            {
                              quantity: Number(item.quantity) || 0,
                              unitPrice: Number(item.unitPrice) || 0,
                              discountType: item.discountType ?? null,
                              discountValue: item.discountValue != null && item.discountValue > 0 ? Number(item.discountValue) : null,
                              taxRate: rate,
                              taxType: variant.saleTaxType ?? (rate > 0 ? TaxTypeEnum.WithTax : null),
                            },
                          ],
                          {}
                        ).lines[0]
                      : undefined;

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
                                  containerName={`estimate-product-${index}`}
                                  onChange={(value) => selectVariant(index, value === '' ? undefined : Number(value))}
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
                      <td className="px-1 py-1.5">
                        <FormField
                          control={control}
                          name={`items.${index}.unitPrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  placeholder="0.00"
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
                      <td className="px-1 py-1.5">
                        <div className="flex gap-1">
                          <FormField
                            control={control}
                            name={`items.${index}.discountType`}
                            render={({ field }) => (
                              <FormItem className="w-14 shrink-0">
                                <FormControl>
                                  <InputSelect
                                    items={DISCOUNT_TYPE_OPTIONS}
                                    inputClass="h-9"
                                    allowCustomValue={false}
                                    value={field.value ?? DiscountTypeEnum.Percentage}
                                    valueType="string"
                                    containerName={`estimate-discount-type-${index}`}
                                    onChange={(value) => field.onChange(value || DiscountTypeEnum.Percentage)}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={control}
                            name={`items.${index}.discountValue`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    placeholder="0"
                                    className="h-9 text-right"
                                    value={field.value ?? ''}
                                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </td>
                      <td className="px-1 py-1.5">
                        <FormField
                          control={control}
                          name={`items.${index}.taxId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <InputSelect
                                  placeholder="No tax"
                                  items={taxOptions}
                                  inputClass="h-9"
                                  allowCustomValue={false}
                                  value={field.value ?? ''}
                                  valueType="string"
                                  containerName={`estimate-tax-${index}`}
                                  onChange={(value) => field.onChange(value ? String(value) : '')}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </td>
                      <td className="px-2 py-3 text-right text-xs font-semibold tabular-nums">
                        {line ? formatPrice(line.lineTotal) : '—'}
                        {line && line.taxAmount > 0 && (
                          <p className="text-[10px] font-normal text-muted-foreground">incl. tax {formatPrice(line.taxAmount)}</p>
                        )}
                      </td>
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
                      onClick={() => append({ variantId: undefined as unknown as number, quantity: 1, discountType: DiscountTypeEnum.Percentage, taxId: '' })}
                    >
                      Add Row
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <FormItem>
                  <FormLabel className="text-sm font-normal text-muted-foreground">Additional discount</FormLabel>
                  <div className="flex gap-1">
                    <FormField
                      control={control}
                      name="additionalDiscountType"
                      render={({ field }) => (
                        <FormItem className="w-14 shrink-0">
                          <FormControl>
                            <InputSelect
                              items={DISCOUNT_TYPE_OPTIONS}
                              inputClass="h-9"
                              allowCustomValue={false}
                              value={field.value ?? DiscountTypeEnum.Percentage}
                              valueType="string"
                              containerName="estimate-additional-discount-type"
                              onChange={(value) => field.onChange(value || DiscountTypeEnum.Percentage)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="additionalDiscountValue"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              placeholder="0"
                              className="h-9 text-right tabular-nums"
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </FormItem>
                <FormField
                  control={control}
                  name="shippingCharges"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-normal text-muted-foreground">Shipping</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="0"
                          className="h-9 text-right tabular-nums"
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
                  name="adjustment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-normal text-muted-foreground">Adjustment (±)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          className="h-9 text-right tabular-nums"
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
                name="isInterState"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked === true)} />
                    </FormControl>
                    <FormLabel className="text-sm font-normal text-muted-foreground">Inter-state supply (IGST instead of CGST + SGST)</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Notes shown on the estimate" rows={2} {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms &amp; conditions</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Validity, delivery, payment terms…" rows={3} {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold tabular-nums">{formatPrice(totals.subtotal)}</span>
              </div>
              {totals.itemDiscountTotal > 0 && (
                <div className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-muted-foreground">Item discounts</span>
                  <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">−{formatPrice(totals.itemDiscountTotal)}</span>
                </div>
              )}
              {totals.additionalDiscount > 0 && (
                <div className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-muted-foreground">Additional discount</span>
                  <span className="font-semibold tabular-nums text-rose-600 dark:text-rose-400">−{formatPrice(totals.additionalDiscount)}</span>
                </div>
              )}
              {totals.taxAmount > 0 && (
                <div className="space-y-0.5 border-t py-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Taxable amount</span>
                    <span className="font-semibold tabular-nums">{formatPrice(totals.taxableAmount)}</span>
                  </div>
                  {values.isInterState ? (
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>IGST</span>
                      <span className="tabular-nums">{formatPrice(totals.igstAmount)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>CGST</span>
                        <span className="tabular-nums">{formatPrice(totals.cgstAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>SGST</span>
                        <span className="tabular-nums">{formatPrice(totals.sgstAmount)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Total tax (incl. in prices unless marked)</span>
                    <span className="tabular-nums">{formatPrice(totals.taxAmount)}</span>
                  </div>
                </div>
              )}
              {totals.shippingCharges > 0 && (
                <div className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-semibold tabular-nums">{formatPrice(totals.shippingCharges)}</span>
                </div>
              )}
              {totals.adjustment !== 0 && (
                <div className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-muted-foreground">Adjustment</span>
                  <span className="font-semibold tabular-nums">{formatPrice(totals.adjustment)}</span>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between rounded-md bg-primary px-3 py-2.5 text-primary-foreground">
                <span className="text-[11px] font-bold uppercase tracking-wider">Estimate total</span>
                <span className="text-lg font-bold tabular-nums">{formatPrice(totals.grandTotal)}</span>
              </div>
              <div className="mt-2 rounded-lg border border-dashed px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Amount in words</p>
                <p className="mt-1 text-xs font-medium italic leading-relaxed text-muted-foreground">{amountInWords(totals.grandTotal)}</p>
              </div>
              <p className="mt-1.5 text-[10px] text-muted-foreground">An estimate reserves no stock and records no payment.</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => router.push(isEdit && id ? `/admin/estimates/${id}` : '/admin/estimates')}>
              Cancel
            </Button>
            {isEdit ? (
              <Button type="button" loading={isSaving} onClick={handleSubmit((model) => submitData(model, 'DRAFT'))}>
                Save Changes
              </Button>
            ) : (
              <>
                <Button type="button" variant="secondary" loading={isSaving} onClick={handleSubmit((model) => submitData(model, 'DRAFT'))}>
                  Save Draft
                </Button>
                <Button type="button" loading={isSaving} onClick={handleSubmit((model) => submitData(model, 'SENT'))}>
                  Save &amp; Send
                </Button>
              </>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
