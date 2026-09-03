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
import { useGetAllMasterAttributes, useGetAllMasterEntries } from '@/hooks/service-hooks/useMasterEntryService';
import { useGetAllProducts } from '@/hooks/service-hooks/useProductService';
import {
  useCreateProductVariant,
  useGetProductVariantById,
  useGetProductVariants,
  useUpdateProductVariant,
} from '@/hooks/service-hooks/useProductVariantService';
import { zodResolver } from '@/lib/zod-resolver';
import { CreateProductVariantModel, UpdateProductVariantModel } from '@/models/product-variant.model';
import { attributesToRows, emptyAttributeRow, getProductVariantSchema, rowsToAttributes, VariantFormValues } from '@/schema/productVariantSchema';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { Boxes, ChevronsUpDown, ImageIcon, Loader2, Package, Plus, Tag, ToggleLeft, Trash2, TrendingUp, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FieldError, Resolver, useFieldArray, useForm } from 'react-hook-form';
import VariantRating from '../variant-rating';

interface ManageVariantProps {
  id?: number;
  productId?: number;
}

const LIST_URL = '/admin/product-variants';

const money = (amount: number) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const trimmed = (value?: string | null) => (value?.trim() ? value.trim() : undefined);

const intChange = (raw: string) => (raw === '' ? undefined : parseInt(raw, 10));

export default function ManageVariant({ id, productId: initialProductId }: ManageVariantProps) {
  const router = useRouter();
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;

  const createVariantmutate = useCreateProductVariant();
  const updateVariantmutate = useUpdateProductVariant();

  const { data: variantResponse, isLoading: isFetching, isError } = useGetProductVariantById(id ?? 0, isEdit);
  const variant = variantResponse?.data?.data ?? null;

  const { data: getAllproductsResponse } = useGetAllProducts({ showAllRecords: true });

  const productItems = useMemo(
    () => (getAllproductsResponse?.data?.data?.data ?? []).map((product) => ({ value: product.id, label: product.name })),
    [getAllproductsResponse]
  );

  const { data: getAllattributesResponse } = useGetAllMasterAttributes({ showAllRecords: true, status: StatusValues.Published });
  const masterAttributes = useMemo(() => getAllattributesResponse?.data?.data?.data ?? [], [getAllattributesResponse]);

  // Only the edit screen needs the whole value set: it is what turns a legacy `{ size: 'L' }`
  // record back into ids. Creating a variant reads values per attribute via MasterEntrySelect.
  const { data: entriesResponse, isSuccess: entriesLoaded } = useGetAllMasterEntries(
    { showAllRecords: true, status: StatusValues.Published },
    isEdit
  );
  const masterEntries = useMemo(() => entriesResponse?.data?.data?.data ?? [], [entriesResponse]);

  const [selectedProductId, setSelectedProductId] = useState<number | undefined>(initialProductId);
  const { data: siblingsResponse } = useGetProductVariants(selectedProductId ?? 0, { recordPerPage: 1 }, !isEdit && !!selectedProductId);
  const isFirstVariant = !isEdit && (siblingsResponse?.data?.data?.totalRecord ?? 0) === 0;

  // `isFirstVariant` is only known once the siblings query answers, so the schema is built per
  // validation run from a ref. A resolver captured at mount would keep demanding an attribute
  // from a product's only variant.
  const attributeRules = useRef({ isFirstVariant, isEdit });
  attributeRules.current = { isFirstVariant, isEdit };

  const resolver: Resolver<VariantFormValues> = (values, context, options) =>
    zodResolver<VariantFormValues>(getProductVariantSchema(attributeRules.current.isFirstVariant, attributeRules.current.isEdit))(
      values,
      context,
      options
    );

  const form = useForm<VariantFormValues>({
    resolver,
    defaultValues: {
      productId: initialProductId,
      name: '',
      description: '',
      attributes: [{ ...emptyAttributeRow }],
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

  const { control, handleSubmit, reset, setValue, watch, formState } = form;

  const {
    fields: attributeFields,
    append: appendAttribute,
    remove: removeAttribute,
  } = useFieldArray({ control, name: 'attributes', keyName: 'key' });

  const attributes = watch('attributes') ?? [];
  const sellingPrice = watch('sellingPrice');
  const costPrice = watch('costPrice');
  const offerPrice = watch('offerPrice');
  const isOffer = watch('isOffer');
  const effectiveTo = watch('effectiveTo');

  const savingsPercent =
    offerPrice != null && sellingPrice != null && Number(sellingPrice) > 0 ? Math.round((1 - Number(offerPrice) / Number(sellingPrice)) * 100) : 0;
  // Mirrors payablePrice() on the API: the offer amount only counts while the switch is on.
  const payable = isOffer && offerPrice != null ? Number(offerPrice) : sellingPrice != null ? Number(sellingPrice) : null;

  const margin =
    sellingPrice != null && costPrice != null && Number(sellingPrice) > 0
      ? ((Number(sellingPrice) - Number(costPrice)) / Number(sellingPrice)) * 100
      : null;

  // Hydrated once per variant: the master-data queries refetch on focus, and re-running the
  // reset would throw away whatever the user had typed since.
  const hydratedId = useRef<number | null>(null);

  useEffect(() => {
    if (!isEdit || !variant || hydratedId.current === variant.id) return;
    // A legacy record cannot be mapped before the master data lands; an id array can.
    const needsMasterData = !!variant.attributes && typeof variant.attributes === 'object' && !Array.isArray(variant.attributes);
    if (needsMasterData && !(masterAttributes.length > 0 && entriesLoaded)) return;

    hydratedId.current = variant.id;
    const rows = attributesToRows(variant.attributes, masterAttributes, masterEntries);
    setSelectedProductId(variant.product?.id);
    reset({
      productId: variant.product?.id,
      name: variant.name ?? '',
      description: variant.description ?? '',
      attributes: rows.length > 0 ? rows : [{ ...emptyAttributeRow }],
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
      // A reprice starts now; the stored start date belongs to the period being replaced.
      effectiveFrom: null,
      effectiveTo: variant.effectiveTo ? new Date(variant.effectiveTo) : null,
      reason: '',
    });
  }, [isEdit, variant, masterAttributes, masterEntries, entriesLoaded, reset]);

  const submitData = async (values: VariantFormValues) => {
    console.log('values', values);
    const attributeRows = rowsToAttributes(values.attributes);
    // On edit, an empty array is only sent when the user actually cleared the rows - a legacy
    // pair that could not be resolved must not silently wipe what the variant already has.
    const sendAttributes = !isEdit || attributeRows.length > 0 || !!formState.dirtyFields.attributes;

    const shared = {
      name: values.name?.trim() ?? '',
      description: values.description?.trim() ?? '',
      images: values.images ?? [],
      isActive: values.isActive ?? true,
      isOffer: values.isOffer ?? false,
      sku: trimmed(values.sku),
      barcode: trimmed(values.barcode) ?? null,
      lowStockThreshold: values.lowStockThreshold ?? null,
      stockQuantity: values.stockQuantity ?? undefined,
      sellingPrice: values.sellingPrice ?? undefined,
      costPrice: values.costPrice ?? null,
      // Switching the offer off clears the amount rather than leaving a stale one on the row.
      offerPrice: values.isOffer ? (values.offerPrice ?? null) : null,
      // Only sent when the user picked a date: on update, any `effectiveFrom` at all counts as
      // a reprice and files a new PriceHistory row even when the amounts did not change.
      ...(values.effectiveFrom ? { effectiveFrom: values.effectiveFrom } : {}),
      effectiveTo: values.effectiveTo ?? null,
      reason: trimmed(values.reason) ?? null,
      ...(sendAttributes ? { attributes: attributeRows } : {}),
    };

    const response = isEdit
      ? await updateVariantmutate.mutateAsync({ id: id!, model: shared as UpdateProductVariantModel })
      : await createVariantmutate.mutateAsync({
          ...shared,
          productId: Number(values.productId),
          // Always dated on create: the service opens the first price period with
          // `new Date(data.effectiveFrom)`, which an omitted value turns into an Invalid Date.
          effectiveFrom: values.effectiveFrom ?? new Date(),
        } as CreateProductVariantModel);

    if (response && (response.status === 200 || response.status === 201)) {
      toast({ variant: 'success', title: `Variant ${isEdit ? 'updated' : 'created'} successfully` });
      router.push(LIST_URL);
      return;
    }

    const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
    toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
  };

  const isLoading = createVariantmutate.isPending || updateVariantmutate.isPending || isFetching;
  const attributesOptional = isEdit || isFirstVariant;
  // The array-level rule (at least one pair) hangs off the array itself, not off a dropdown.
  const attributesError = formState.errors.attributes as unknown as FieldError | undefined;

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
                        valueType="number"
                        placeholder="Select product"
                        buttonClass="w-full"
                        containerName="variant-product"
                        onChange={(value) => {
                          const picked = value ? Number(value) : undefined;
                          field.onChange(picked);
                          setSelectedProductId(picked);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </FormSection>
        </Card>

        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Variant name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder='e.g. 64GB / 4GB / 4.5"' {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Description <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Textarea placeholder="What makes this variant distinct - fabric, capacity, finish." rows={3} {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <Card>
          <FormSection
            icon={Tag}
            title="Attributes"
            description={
              attributesOptional
                ? 'What tells this variant apart from its siblings, e.g. Size = L. Optional for a product that is sold in only one version.'
                : 'What tells this variant apart from its siblings, e.g. Size = L. Values come from Master Entries.'
            }
          >
            <div className="space-y-3">
              {attributeFields.length === 0 && (
                <p className="text-sm text-muted-foreground">No attributes — this variant is the product’s only version.</p>
              )}

              {attributeFields.map((row, index) => {
                // An attribute already used by another row is off the list, so two rows cannot
                // both claim "Size" and collapse into one entry on save.
                const takenElsewhere = attributes.filter((_, i) => i !== index).map((item) => Number(item?.attributeid));
                const currentId = Number(attributes[index]?.attributeid);
                const availableAttributes = masterAttributes.filter(
                  (attribute) => !takenElsewhere.includes(attribute.id) || attribute.id === currentId
                );
                const attributeCode = masterAttributes.find((attribute) => attribute.id === currentId)?.code;

                return (
                  <div key={row.key} className="grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-[1fr_1fr_auto]">
                    <FormField
                      control={control}
                      name={`attributes.${index}.attributeid`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Attribute</FormLabel>
                          <FormControl>
                            <SelectSearch
                              items={availableAttributes.map((attribute) => ({ label: attribute.name, value: attribute.id }))}
                              value={field.value ?? ''}
                              valueType="number"
                              placeholder="Select attribute"
                              buttonClass="w-full"
                              containerName={`variant-attribute-${index}`}
                              onChange={(value) => {
                                field.onChange(value ? Number(value) : null);
                                // The old value belongs to the old attribute's value set.
                                setValue(`attributes.${index}.attributeValueId`, null, { shouldDirty: true });
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`attributes.${index}.attributeValueId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Value</FormLabel>
                          <FormControl>
                            {attributeCode ? (
                              <MasterEntrySelect
                                attributeCode={attributeCode}
                                bindTo="id"
                                showColorSwatch
                                value={field.value ?? ''}
                                onChange={(value) => field.onChange(value ? Number(value) : null)}
                                buttonClass="w-full"
                              />
                            ) : (
                              <Button type="button" variant="outline" size="sm" disabled className="h-11 w-full justify-between font-normal">
                                Pick an attribute first
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-end">
                      <Button type="button" variant="ghost" size="icon" aria-label="Remove attribute" onClick={() => removeAttribute(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {attributesError?.message && <p className="text-sm font-medium text-destructive">{attributesError.message}</p>}

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={attributeFields.length >= masterAttributes.length}
                onClick={() => appendAttribute({ ...emptyAttributeRow })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add attribute
              </Button>
            </div>
          </FormSection>
        </Card>

        <Card>
          <FormSection
            icon={Wallet}
            title="Pricing"
            description="The price is filed in the Price History ledger. Changing it later appends a new entry rather than overwriting the old one."
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              </div>

              {(margin !== null || payable != null) && (
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs">
                  {payable != null && (
                    <span className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Customer pays</span>
                      <span className="font-semibold text-foreground">{money(payable)}</span>
                      {isOffer && offerPrice != null && savingsPercent > 0 && (
                        <span className="font-medium text-emerald-600 dark:text-emerald-500">{savingsPercent}% off</span>
                      )}
                    </span>
                  )}
                  {margin !== null && (
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Margin</span>
                      <span className={margin >= 0 ? 'font-semibold text-emerald-600 dark:text-emerald-500' : 'font-semibold text-red-600'}>
                        {margin.toFixed(1)}%
                      </span>
                    </span>
                  )}
                </div>
              )}

              <div className="rounded-lg border border-border">
                <FormField
                  control={control}
                  name="isOffer"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4 space-y-0 p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="flex items-center gap-2">
                          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                          Run an offer
                        </FormLabel>
                        <p className="text-[11px] text-muted-foreground">
                          {field.value
                            ? 'Customers are charged the offer price for the window below.'
                            : 'Off, so customers are charged the selling price.'}
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? false}
                          aria-label="Run an offer"
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            // Switching off clears the amount and the window, so nothing stale
                            // is left hidden behind the toggle.
                            if (!checked) {
                              setValue('offerPrice', undefined);
                              setValue('effectiveFrom', null);
                              setValue('effectiveTo', null);
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {isOffer && (
                  <div className="grid grid-cols-1 gap-4 border-t border-border p-3 sm:grid-cols-3">
                    <FormField
                      control={control}
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
                      control={control}
                      name="effectiveFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Starts</FormLabel>
                          <FormControl>
                            <DateRangePicker
                              value={field.value ? { from: field.value } : undefined}
                              onSelect={(range) => field.onChange(range?.from ?? null)}
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
                      control={control}
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
                    {/* The end date closes the price period itself, not just the discount, so the
                        variant reads as unpriced once it passes. */}
                    <p className="text-[11px] text-muted-foreground sm:col-span-3">
                      {effectiveTo
                        ? 'After the end date the variant has no price at all and cannot be bought until a new price is filed.'
                        : 'Leave the end date empty to keep this price until the next one replaces it.'}
                    </p>
                  </div>
                )}
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
