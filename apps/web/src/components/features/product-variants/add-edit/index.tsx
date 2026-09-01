'use client';
import { ProductImageUploader } from '@/components/common/admin-media/product-image-uploader';
import { CurrencyInput } from '@/components/common/currency-input';
import { DateRangePicker } from '@/components/common/date-range-picker';
import { FormSection } from '@/components/common/form-section';
import MasterEntrySelect from '@/components/common/master-entry-select';
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
import { useGetAllMasterAttributes } from '@/hooks/service-hooks/useMasterEntryService';
import { useGetAllProducts } from '@/hooks/service-hooks/useProductService';
import {
  useCreateProductVariant,
  useGetProductVariantById,
  useGetProductVariants,
  useUpdateProductVariant,
} from '@/hooks/service-hooks/useProductVariantService';
import { zodResolver } from '@/lib/zod-resolver';
import { CreateProductVariantModel, UpdateProductVariantModel } from '@/models/product-variant.model';
import { getProductVariantSchema, rowsToAttributes, VariantAttributeRow, VariantFormValues } from '@/schema/productVariantSchema';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import VariantRating from '../variant-rating';
import { Boxes, ImageIcon, Loader2, Package, Plus, Tag, ToggleLeft, Trash2, TrendingUp, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Resolver, useFieldArray, useForm } from 'react-hook-form';

interface ManageVariantProps {
  id?: number;
  productId?: number;
}

const LIST_URL = '/admin/product-variants';

const emptyRow: VariantAttributeRow = { code: '', value: '' };

const defaultValues: VariantFormValues = {
  productId: undefined,
  name: '',
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
  effectiveFrom: null,
  effectiveTo: null,
  reason: '',
  rows: [emptyRow],
};

const trimmed = (value?: string | null) => (value?.trim() ? value.trim() : undefined);

const intChange = (raw: string) => (raw === '' ? undefined : parseInt(raw, 10));

const toAttributeEntries = (attributes: unknown): [string, unknown][] =>
  attributes && typeof attributes === 'object' && !Array.isArray(attributes) ? Object.entries(attributes) : [];

export default function ManageVariant({ id, productId: initialProductId }: ManageVariantProps) {
  const router = useRouter();
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;

  const createVariant = useCreateProductVariant();
  const updateVariant = useUpdateProductVariant();

  const { data: variantResponse, isLoading: isFetching, isError } = useGetProductVariantById(id ?? 0, isEdit);
  const variant = variantResponse?.data?.data ?? null;

  const { data: productsResponse } = useGetAllProducts({ showAllRecords: true });
  const productItems = useMemo(
    () => (productsResponse?.data?.data?.data ?? []).map((product) => ({ value: product.id, label: product.name })),
    [productsResponse]
  );

  const { data: attributesResponse } = useGetAllMasterAttributes({ showAllRecords: true, status: StatusValues.Published });
  const masterAttributes = useMemo(() => attributesResponse?.data?.data?.data ?? [], [attributesResponse]);
  const attributeItems = useMemo(() => masterAttributes.map((attribute) => ({ label: attribute.name, value: attribute.code })), [masterAttributes]);

  const schemaRef = useRef(getProductVariantSchema(false, isEdit));
  const resolver = useCallback<Resolver<VariantFormValues>>(
    (values, context, options) => zodResolver<VariantFormValues>(schemaRef.current)(values, context, options),
    []
  );

  const form = useForm<VariantFormValues>({
    resolver,
    defaultValues: { ...defaultValues, productId: initialProductId },
  });
  const { control, handleSubmit, reset, setValue, watch, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'rows' });

  const rows = watch('rows');
  const sellingPrice = watch('sellingPrice');
  const costPrice = watch('costPrice');
  const offerPrice = watch('offerPrice');
  const isOffer = watch('isOffer');
  const savingsPercent =
    offerPrice != null && sellingPrice != null && Number(sellingPrice) > 0
      ? Math.round((1 - Number(offerPrice) / Number(sellingPrice)) * 100)
      : 0;
  const selectedProductId = watch('productId');

  const { data: siblingsResponse } = useGetProductVariants(selectedProductId ?? 0, { recordPerPage: 1 }, !isEdit && !!selectedProductId);
  const isFirstVariant = !isEdit && (siblingsResponse?.data?.data?.totalRecord ?? 0) === 0;

  schemaRef.current = useMemo(() => getProductVariantSchema(isFirstVariant, isEdit), [isFirstVariant, isEdit]);

  useEffect(() => {
    if (!isEdit || !variant || masterAttributes.length === 0) return;
    const builtRows = toAttributeEntries(variant.attributes).map(([key, value]) => {
      const master = masterAttributes.find((m) => m.code.toLowerCase() === key.toLowerCase());
      return { code: master ? master.code : key.toUpperCase(), value: String(value) };
    });
    reset({
      productId: variant.product?.id,
      name: variant.name ?? '',
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
      effectiveFrom: null,
      effectiveTo: variant.effectiveTo ? new Date(variant.effectiveTo) : null,
      reason: '',
      rows: builtRows.length ? builtRows : [emptyRow],
    });
  }, [isEdit, variant, masterAttributes, reset]);

  const margin =
    sellingPrice != null && costPrice != null && Number(sellingPrice) > 0
      ? ((Number(sellingPrice) - Number(costPrice)) / Number(sellingPrice)) * 100
      : null;

  const toCreateModel = (model: VariantFormValues): CreateProductVariantModel => ({
    productId: Number(model.productId),
    attributes: rowsToAttributes(model.rows),
    sellingPrice: Number(model.sellingPrice),
    supersedePrevious: false,
    images: model.images ?? [],
    ...(trimmed(model.name) && { name: trimmed(model.name) }),
    ...(trimmed(model.sku) && { sku: trimmed(model.sku) }),
    ...(model.stockQuantity != null && { stockQuantity: Number(model.stockQuantity) }),
    ...(model.costPrice != null && { costPrice: Number(model.costPrice) }),
    ...(model.offerPrice != null && { offerPrice: Number(model.offerPrice) }),
    ...(model.isOffer !== undefined && { isOffer: model.isOffer }),
    ...(model.effectiveFrom && { effectiveFrom: model.effectiveFrom.toISOString() }),
    ...(model.effectiveTo && { effectiveTo: model.effectiveTo.toISOString() }),
    ...(trimmed(model.reason) && { reason: trimmed(model.reason) }),
  });

  const toUpdateModel = (model: VariantFormValues): UpdateProductVariantModel => ({
    name: trimmed(model.name) ?? null,
    barcode: trimmed(model.barcode) ?? null,
    attributes: rowsToAttributes(model.rows),
    images: model.images ?? [],
    lowStockThreshold: model.lowStockThreshold ?? null,
    isActive: model.isActive ?? true,
    ...(model.sellingPrice != null && { sellingPrice: Number(model.sellingPrice) }),
    // Sent unconditionally: the field being cleared has to reach the API as null, or the
    // reprice would carry the old offer forward and the promotion could never be removed.
    offerPrice: model.offerPrice != null ? Number(model.offerPrice) : null,
    isOffer: model.isOffer ?? false,
    costPrice: model.costPrice ?? null,
    ...(model.effectiveFrom && { effectiveFrom: model.effectiveFrom.toISOString() }),
    // Sent unconditionally so clearing the field reaches the API as null and reopens the period.
    effectiveTo: model.effectiveTo ? model.effectiveTo.toISOString() : null,
    ...(model.stockQuantity != null && { stockQuantity: Number(model.stockQuantity) }),
    ...(trimmed(model.sku) && { sku: trimmed(model.sku) }),
    ...(trimmed(model.reason) && { reason: trimmed(model.reason) }),
  });

  const submitData = async (model: VariantFormValues) => {
    try {
      const response =
        isEdit && variant
          ? await updateVariant.mutateAsync({ id: variant.id, model: toUpdateModel(model) })
          : await createVariant.mutateAsync(toCreateModel(model));

      if (response && (response.status === 200 || response.status === 201)) {
        toast({ variant: 'success', title: isEdit ? 'Variant updated successfully' : 'Variant added successfully' });
        router.push(LIST_URL);
      } else {
        const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
        toast({ variant: 'destructive', title: isEdit ? 'Could not update variant' : 'Could not add variant', description: <span>{error}</span> });
      }
    } catch (error: any) {
      const message = unitOfService.ErrorHandlerService.getErrorMessage(error);
      toast({
        variant: 'destructive',
        title: isEdit ? 'Could not update variant' : 'Could not add variant',
        description: <span>{message || 'Unknown error occurred'}</span>,
      });
    }
  };

  const isLoading = createVariant.isPending || updateVariant.isPending;
  const rowsError = (formState.errors.rows as { message?: string } | undefined)?.message;
  const attributesOptional = isEdit || isFirstVariant;

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
          <Button type="button" variant="outline" onClick={() => router.push(LIST_URL)}>
            Back to variants
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form autoComplete="off" onSubmit={handleSubmit(submitData)} className="space-y-4">
        <Card>
          <FormField
            control={control}
            name="productId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product *</FormLabel>
                <FormControl>
                  <SelectSearch
                    items={productItems}
                    value={field.value ?? ''}
                    placeholder="Select product"
                    buttonClass="w-full"
                    containerName="variant-product"
                    onChange={(value) => field.onChange(value ? Number(value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormSection
            icon={Package}
            title="Product"
            description={
              isEdit
                ? 'A variant cannot be moved between products. Create a new one under the other product instead.'
                : 'The product this variant is a sellable version of.'
            }
          >
            {isEdit ? (
              <div className="space-y-2">
                <div className="flex h-10 items-center gap-2 text-sm">
                  <span className="font-medium">{variant?.product?.name ?? '—'}</span>
                  {variant?.sku && <code className="font-mono text-xs text-muted-foreground">{variant.sku}</code>}
                </div>
                {/* Rating posts immediately - it is its own endpoint, not part of this form's submit. */}
                {variant && <VariantRating variantId={variant.id} rating={variant.rating} ratingCount={variant.ratingCount} interactive size="md" />}
              </div>
            ) : (
              <FormField
                control={control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product *</FormLabel>
                    <FormControl>
                      <SelectSearch
                        items={productItems}
                        value={field.value ?? ''}
                        placeholder="Select product"
                        buttonClass="w-full"
                        containerName="variant-product"
                        onChange={(value) => field.onChange(value ? Number(value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </FormSection>
        </Card>

        <Card>
          <FormSection
            icon={Tag}
            title="Variant"
            description={
              isFirstVariant
                ? 'Attributes are only needed if the product comes in variations (size, colour, pack).'
                : 'Pick the attributes that make this variant different from the others, such as Size = L.'
            }
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <FormLabel>Attributes {attributesOptional ? <span className="font-normal text-muted-foreground">(optional)</span> : '*'}</FormLabel>
                <div className="space-y-2">
                  {fields.map((fieldRow, index) => (
                    <div key={fieldRow.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <FormField
                        control={control}
                        name={`rows.${index}.code`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <SelectSearch
                                items={attributeItems}
                                value={field.value}
                                valueType="string"
                                placeholder="Attribute"
                                buttonClass="w-full"
                                containerName={`variant-attribute-${fieldRow.id}`}
                                onChange={(value) => {
                                  field.onChange(value ? String(value) : '');
                                  setValue(`rows.${index}.value`, '');
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      {rows?.[index]?.code ? (
                        <FormField
                          control={control}
                          name={`rows.${index}.value`}
                          render={({ field }) => (
                            <FormItem className="space-y-0">
                              <FormControl>
                                <MasterEntrySelect
                                  attributeCode={rows[index].code}
                                  value={field.value}
                                  onChange={(value) => field.onChange(value ? String(value) : '')}
                                  buttonClass="w-full"
                                  showColorSwatch
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      ) : (
                        <Input disabled placeholder="Pick an attribute first" />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        disabled={fields.length === 1 && !attributesOptional}
                        onClick={() => remove(index)}
                        title="Remove attribute"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => append(emptyRow)} icon={Plus} iconPlacement="left">
                  Add attribute
                </Button>
                {rowsError && <p className="text-sm font-medium text-destructive">{rowsError}</p>}
              </div>

              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Variant name <span className="font-normal text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. 64GB / 4GB / 4.5" — defaults to the attribute combination' {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Auto-generated if left blank"
                          className="font-mono"
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
                  control={control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barcode</FormLabel>
                      <FormControl>
                        <Input placeholder="Barcode" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </FormSection>
        </Card>

        <Card>
          <FormSection
            icon={Wallet}
            title="Pricing"
            description="The price is filed in the Price History ledger. Changing it later appends a new entry rather than overwriting the old one."
          >
            <div className="space-y-3">
              {margin !== null && (
                <div className="flex justify-end">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      margin >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    <TrendingUp className="h-3 w-3" />
                    {margin.toFixed(1)}% margin
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={control}
                  name="sellingPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selling price {isEdit ? '' : '*'}</FormLabel>
                      <FormControl>
                        <CurrencyInput value={field.value ?? ''} onChange={(value) => field.onChange(value === '' ? undefined : value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost price</FormLabel>
                      <FormControl>
                        <CurrencyInput value={field.value ?? ''} onChange={(value) => field.onChange(value === '' ? undefined : value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="offerPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Offer price</FormLabel>
                      <FormControl>
                        <CurrencyInput value={field.value ?? ''} onChange={(value) => field.onChange(value === '' ? undefined : value)} />
                      </FormControl>
                      {/* Says plainly which price will be charged, so the switch is never ambiguous. */}
                      <p className="text-[11px] text-muted-foreground">
                        {isOffer && offerPrice != null
                          ? 'Customers are charged this while the offer is on.'
                          : offerPrice != null
                            ? 'Staged - turn the offer on to charge it.'
                            : 'Leave empty for no offer.'}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="isOffer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Offer active</FormLabel>
                      <FormControl>
                        <div className="flex h-10 items-center gap-2.5">
                          <Switch checked={field.value ?? false} onCheckedChange={field.onChange} aria-label="Offer active" />
                          <span className="text-sm text-muted-foreground">
                            {field.value ? (
                              savingsPercent > 0 ? (
                                <span className="font-medium text-emerald-600 dark:text-emerald-500">{savingsPercent}% off</span>
                              ) : (
                                'On'
                              )
                            ) : (
                              'Off'
                            )}
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="effectiveFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isEdit ? 'New price effective from' : 'Price effective from'}</FormLabel>
                      <FormControl>
                        <DateRangePicker
                          value={field.value ? { from: field.value } : undefined}
                          onSelect={(range) => field.onChange(range?.from ?? null)}
                          numberOfMonthsToShow={1}
                          placeholder="Apply now"
                          buttonClass="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="effectiveTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price effective to</FormLabel>
                      <FormControl>
                        <DateRangePicker
                          value={field.value ? { from: field.value } : undefined}
                          onSelect={(range) => field.onChange(range?.from ?? null)}
                          numberOfMonthsToShow={1}
                          placeholder="No end date"
                          buttonClass="w-full"
                        />
                      </FormControl>
                      {/* This end date makes the variant unpriced, not merely un-discounted -
                          worth saying outright, since it is the opposite of what most expect. */}
                      <p className="text-[11px] text-muted-foreground">
                        {field.value
                          ? 'After this date the variant has no price and cannot be bought.'
                          : 'Leave empty to keep this price until the next one replaces it.'}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </FormSection>
        </Card>

        <Card>
          <FormSection
            icon={Boxes}
            title="Inventory"
            description={
              isEdit
                ? 'Enter the target on-hand quantity; the difference is booked as an adjustment movement.'
                : 'Opening stock is booked as the first stock movement for this variant.'
            }
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={control}
                name="stockQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEdit ? 'On-hand stock' : 'Opening stock'}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        placeholder="0"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(intChange(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="lowStockThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Low-stock threshold</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        placeholder="5"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(intChange(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </FormSection>
        </Card>

        <Card>
          <FormSection
            icon={ImageIcon}
            title="Media"
            description="Photos specific to this variant. The product's own images are used when none are set."
          >
            <FormField
              control={control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ProductImageUploader value={field.value || []} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>
        </Card>

        <Card>
          <FormSection icon={ToggleLeft} title="Status" description="Retired variants stay in history but can no longer be sold.">
            <div className="space-y-4">
              <FormField
                control={control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex h-10 items-center gap-2">
                        <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                        <span className="text-sm text-muted-foreground">{field.value ? 'Active (sellable)' : 'Retired'}</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Reason <span className="font-normal text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g. New colourway for spring" rows={2} className="resize-none" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </FormSection>
        </Card>

        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-border bg-background/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-5">
          <Button type="button" variant="outline" onClick={() => router.push(LIST_URL)} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            {isEdit ? 'Update Variant' : 'Create Variant'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
