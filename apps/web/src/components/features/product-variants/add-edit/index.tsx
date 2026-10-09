'use client';
import { ProductImageUploader } from '@/components/common/admin-media/product-image-uploader';
import ConfirmBox from '@/components/common/confirm-box';
import { CurrencyInput } from '@/components/common/currency-input';
import { DateRangePicker } from '@/components/common/date-range-picker';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { StatusValues } from '@/enums/status-values.enum';
import { useGetAllMasterAttributes, useGetAllMasterEntries } from '@/hooks/service-hooks/useMasterEntryService';
import { useGetAllProducts } from '@/hooks/service-hooks/useProductService';
import { useCreateProductVariant, useGetProductVariantById, useUpdateProductVariant } from '@/hooks/service-hooks/useProductVariantService';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';
import { cn } from '@/lib/utils';
import { zodResolver } from '@/lib/zod-resolver';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ProductVariantCreateRequest, ProductVariantModel, ProductVariantUpdateRequest, productVariantValidator } from '@pms/types';
import { ChevronDown, Loader2, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { KeyboardEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import VariantRating from '../variant-rating';
import AttributeRows, { toAttributeRows } from './attribute-rows';

interface ManageVariantProps {
  id?: number;
  productId?: number;
  /** Set when the form is opened on the variant's own page, so Cancel just closes it. */
  onCancel?: () => void;
  /** Set when the form is opened on the variant's own page, so a save closes it instead of leaving. */
  onSaved?: () => void;
}

const LIST_URL = '/admin/product-variants';

const money = (amount: number) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ManageVariant({ id, productId, onCancel, onSaved }: ManageVariantProps) {
  const router = useRouter();
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;
  const isInline = !!onCancel;

  const createMutation = useCreateProductVariant();
  const updateMutation = useUpdateProductVariant();

  const { data: getVariantResponse, isLoading: isFetching, isError } = useGetProductVariantById(id ?? 0, isEdit);
  const variant = getVariantResponse?.data?.data;

  const { data: getProductsResponse } = useGetAllProducts({ showAllRecords: true });
  const productItems = useMemo(
    () => (getProductsResponse?.data?.data?.data ?? []).map((product) => ({ value: product.id, label: product.name })),
    [getProductsResponse]
  );

  const { data: getAttributesResponse } = useGetAllMasterAttributes({ showAllRecords: true, status: StatusValues.Published });
  const masterAttributes = useMemo(() => getAttributesResponse?.data?.data?.data ?? [], [getAttributesResponse]);

  const { data: getEntriesResponse } = useGetAllMasterEntries({ showAllRecords: true, status: StatusValues.Published }, isEdit);
  const masterEntries = useMemo(() => getEntriesResponse?.data?.data?.data ?? [], [getEntriesResponse]);

  const [priceOpen, setPriceOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const form = useForm<ProductVariantModel>({
    resolver: zodResolver(productVariantValidator),
    defaultValues: {
      productId,
      name: '',
      description: '',
      attributes: [],
      sku: undefined,
      barcode: '',
      images: [],
      lowStockThreshold: undefined,
      isActive: true,
      stockQuantity: undefined,
      sellingPrice: undefined,
      costPrice: undefined,
      offerPrice: undefined,
      isOffer: false,
      effectiveFrom: undefined,
      effectiveTo: null,
      reason: '',
    },
  });

  const { isDirty } = form.formState;
  const isOffer = form.watch('isOffer');
  const sellingPrice = form.watch('sellingPrice');
  const costPrice = form.watch('costPrice');
  const offerPrice = form.watch('offerPrice');
  const effectiveTo = form.watch('effectiveTo');
  const attributes = form.watch('attributes') ?? [];
  const sku = form.watch('sku');
  const images = form.watch('images') ?? [];
  const stockQuantity = form.watch('stockQuantity');

  // Mirrors payablePrice() on the API: the offer amount only counts while the switch is on.
  const payable = isOffer && offerPrice != null ? offerPrice : (sellingPrice ?? null);
  const savings = offerPrice != null && sellingPrice ? Math.round((1 - offerPrice / sellingPrice) * 100) : 0;
  const margin = costPrice != null && sellingPrice ? ((sellingPrice - costPrice) / sellingPrice) * 100 : null;

  useEffect(() => {
    // `isDirty` stops a background refetch of the master data from overwriting typed-in edits.
    if (!isEdit || !variant || form.formState.isDirty) return;

    form.reset({
      productId: variant.product?.id,
      name: variant.name ?? '',
      description: variant.description ?? '',
      attributes: toAttributeRows(variant.attributes, masterAttributes, masterEntries),
      sku: variant.sku,
      barcode: variant.barcode ?? '',
      images: variant.images ?? [],
      lowStockThreshold: variant.lowStockThreshold ?? undefined,
      isActive: variant.isActive ?? true,
      stockQuantity: variant.stockQuantity ?? undefined,
      sellingPrice: variant.sellingPrice ?? undefined,
      costPrice: variant.costPrice ?? undefined,
      offerPrice: variant.offerPrice ?? undefined,
      isOffer: variant.isOffer ?? false,
      effectiveFrom: undefined,
      effectiveTo: variant.effectiveTo ? new Date(variant.effectiveTo) : null,
      reason: '',
    });
  }, [isEdit, variant, masterAttributes, masterEntries, form]);

  const submitData = async (model: ProductVariantModel) => {
    const response = isEdit
      ? await updateMutation.mutateAsync({ id: id!, model: model as ProductVariantUpdateRequest })
      : await createMutation.mutateAsync(model as ProductVariantCreateRequest);

    if (response && (response.status === 200 || response.status === 201)) {
      toast({ variant: 'success', title: `Variant ${isEdit ? 'updated' : 'created'} successfully` });
      form.reset(model);
      if (onSaved) onSaved();
      else router.push(LIST_URL);
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  };

  // Most fields live behind a disclosure; if one of them blocks the save it has to unfold, or
  // the form refuses with the message out of sight.
  const onSubmit = form.handleSubmit(submitData, (errors) => {
    if (errors.costPrice || errors.offerPrice || errors.effectiveFrom || errors.effectiveTo) setPriceOpen(true);
    if (errors.attributes || errors.sku || errors.barcode || errors.stockQuantity || errors.lowStockThreshold || errors.images || errors.reason) setMoreOpen(true);
  });

  const isLoading = createMutation.isPending || updateMutation.isPending || isFetching;
  const isSaving = createMutation.isPending || updateMutation.isPending;
  useUnsavedChangesWarning(isDirty && !isSaving);

  const leave = () => {
    if (onCancel) onCancel();
    else router.push(LIST_URL);
  };

  const handleCancel = () => {
    if (isDirty && !isSaving) {
      setShowLeaveConfirm(true);
      return;
    }
    leave();
  };

  // Ctrl/Cmd+Enter saves from anywhere in the form, so a keyboard user never has to reach the footer.
  const onFormKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  if (isEdit && isFetching) {
    return (
      <Card>
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading variant…
        </div>
      </Card>
    );
  }

  if (isEdit && (isError || !variant)) {
    return (
      <Card>
        <div className="space-y-3 py-16 text-center">
          <p className="text-sm text-muted-foreground">This variant could not be found.</p>
          <Button type="button" variant="outline" onClick={leave}>
            Back to variants
          </Button>
        </div>
      </Card>
    );
  }

  // Both summaries keep the stored values readable while their section is closed.
  const priceSummary = [
    costPrice != null ? `cost ${money(costPrice)}` : null,
    isOffer && offerPrice != null ? `offer ${money(offerPrice)}` : isOffer ? 'offer on' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const moreSummary = [
    attributes.length > 0 ? `${attributes.length} ${attributes.length === 1 ? 'attribute' : 'attributes'}` : null,
    sku ? sku : null,
    stockQuantity != null ? `stock ${stockQuantity}` : null,
    images.length > 0 ? `${images.length} ${images.length === 1 ? 'image' : 'images'}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <Form {...form}>
        <form
          autoComplete="off"
          onSubmit={onSubmit}
          onKeyDown={onFormKeyDown}
          className={cn('flex flex-col', !isInline && 'rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm')}
        >
          <div className="space-y-5 px-4 py-5 sm:px-5">
            {isEdit ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border bg-muted/30 px-3 py-2.5">
                <span className="text-sm font-medium">{variant?.product?.name ?? '—'}</span>
                {variant?.sku && <code className="font-mono text-xs text-muted-foreground">{variant.sku}</code>}
                {/* Rating posts immediately - it is its own endpoint, not part of this form's submit. */}
                {variant && <VariantRating variantId={variant.id} rating={variant.rating} ratingCount={variant.ratingCount} interactive size="md" className="ml-auto" />}
              </div>
            ) : (
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product *</FormLabel>
                    <FormControl>
                      <SelectSearch
                        items={productItems}
                        value={field.value ?? ''}
                        valueType="number"
                        placeholder="Select product"
                        buttonClass="h-10 w-full"
                        containerName="variant-product"
                        onChange={(value) => field.onChange(value ? Number(value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variant name *</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. 64GB / 4GB / 4.5"' autoFocus={!isEdit} className="h-10" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What makes this variant distinct - fabric, capacity, finish." rows={3} className="resize-y" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="sellingPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling price *</FormLabel>
                    <FormControl>
                      <CurrencyInput value={field.value ?? ''} onChange={(value) => field.onChange(value === '' ? undefined : value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <div className="flex h-10 items-center gap-2.5 rounded-lg border bg-background px-3">
                        <Switch checked={field.value ?? false} onCheckedChange={field.onChange} aria-label="Active" />
                        <span className={cn('text-sm font-medium', field.value ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground')}>
                          {field.value ? 'Active (sellable)' : 'Retired'}
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {(payable != null || margin !== null) && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-lg border bg-muted/40 px-3 py-2.5 text-xs">
                {payable != null && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Customer pays</span>
                    <span className="font-semibold text-foreground">{money(payable)}</span>
                    {isOffer && savings > 0 && <span className="font-medium text-emerald-600 dark:text-emerald-500">{savings}% off</span>}
                  </span>
                )}
                {margin !== null && (
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Margin</span>
                    <span className={margin >= 0 ? 'font-semibold text-emerald-600 dark:text-emerald-500' : 'font-semibold text-red-600'}>{margin.toFixed(1)}%</span>
                  </span>
                )}
              </div>
            )}

            <Fold title="Cost & offer" summary={priceSummary} open={priceOpen} onToggle={() => setPriceOpen((open) => !open)}>
              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem className="sm:max-w-[240px]">
                    <FormLabel>Cost price</FormLabel>
                    <FormControl>
                      <CurrencyInput value={field.value ?? ''} onChange={(value) => field.onChange(value === '' ? undefined : value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-lg border">
                <FormField
                  control={form.control}
                  name="isOffer"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4 space-y-0 p-3">
                      <FormLabel className="font-medium">Run an offer</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value ?? false}
                          aria-label="Run an offer"
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            // Nothing stale is left hidden behind the toggle.
                            if (!checked) {
                              form.setValue('offerPrice', undefined);
                              form.setValue('effectiveFrom', undefined);
                              form.setValue('effectiveTo', null);
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {isOffer && (
                  <div className="grid grid-cols-1 gap-4 border-t p-3 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="offerPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Offer price *</FormLabel>
                          <FormControl>
                            <CurrencyInput value={field.value ?? ''} onChange={(value) => field.onChange(value === '' ? undefined : value)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="effectiveFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Starts</FormLabel>
                          <FormControl>
                            <DateRangePicker
                              value={field.value ? { from: field.value } : undefined}
                              onSelect={(range) => field.onChange(range?.from)}
                              numberOfMonthsToShow={1}
                              placeholder="Immediately"
                              buttonClass="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="effectiveTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ends</FormLabel>
                          <FormControl>
                            <DateRangePicker
                              value={field.value ? { from: field.value } : undefined}
                              onSelect={(range) => field.onChange(range?.from ?? null)}
                              numberOfMonthsToShow={1}
                              placeholder="No end date"
                              buttonClass="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* The end date closes the price period itself, not just the discount. */}
                    {effectiveTo && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 sm:col-span-3">After this date the variant has no price and cannot be bought.</p>
                    )}
                  </div>
                )}
              </div>
            </Fold>

            <Fold title="Attributes, stock & media" summary={moreSummary} open={moreOpen} onToggle={() => setMoreOpen((open) => !open)}>
              <AttributeRows masterAttributes={masterAttributes} />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Auto-generated if left blank"
                          className="h-10 font-mono"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barcode</FormLabel>
                      <FormControl>
                        <Input placeholder="Barcode" className="h-10" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stockQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isEdit ? 'On-hand stock' : 'Opening stock'}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="0"
                          className="h-10"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lowStockThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Low-stock threshold</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="5"
                          className="h-10"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Images</FormLabel>
                    <FormControl>
                      <ProductImageUploader value={field.value || []} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g. New colourway for spring" rows={2} className="resize-none" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Fold>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className={cn('hidden items-center gap-1.5 text-xs sm:flex', isDirty ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground')}>
              {isDirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
              {isDirty ? 'Unsaved changes' : 'No changes yet'}
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" loading={isLoading}>
                {isEdit ? 'Save changes' : 'Create variant'}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      <ConfirmBox
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onSubmit={() => {
          setShowLeaveConfirm(false);
          leave();
        }}
        heading="Discard changes?"
        bodyText="This variant has unsaved changes. Closing now will lose them."
        noButtonText="Keep editing"
        yesButtonText="Discard"
      />
    </>
  );
}

// Everything the API accepts but does not require, folded away until it is wanted.
function Fold({ title, summary, open, onToggle, children }: { title: string; summary?: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-muted/40">
        <span className="min-w-0 flex-1 text-sm font-semibold leading-tight">{title}</span>
        {!open && summary && <span className="hidden truncate text-[11px] text-muted-foreground sm:inline">{summary}</span>}
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Optional</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && <div className="space-y-5 border-t px-4 py-4">{children}</div>}
    </section>
  );
}
