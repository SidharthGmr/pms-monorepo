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
import { useCreateProductVariant, useGetProductVariants, useUpdateProductVariant } from '@/hooks/service-hooks/useProductVariantService';
import { zodResolver } from '@/lib/zod-resolver';
import { CreateProductVariantModel, UpdateProductVariantModel } from '@/models/product-variant.model';
import { getProductVariantSchema, rowsToAttributes, VariantFormValues } from '@/schema/productVariantSchema';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { Boxes, ImageIcon, Loader2, Plus, Tag, ToggleLeft, Trash2, TrendingUp, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

interface ManageVariantProps {
  productId: number;
  /** > 0 edits that variant; 0 / undefined creates a new one. */
  variantId?: number;
}

const emptyRow = { code: '', value: '' };

const defaultValues: VariantFormValues = {
  name: '',
  sku: undefined,
  barcode: '',
  images: [],
  lowStockThreshold: undefined,
  isActive: true,
  stockQuantity: undefined,
  sellingPrice: undefined,
  costPrice: undefined,
  effectiveFrom: null,
  reason: '',
  rows: [emptyRow],
};

/** Trimmed string, or `undefined` when blank so the key is left out of the request. */
const trimmed = (value?: string | null) => (value?.trim() ? value.trim() : undefined);

export default function ManageVariant({ productId, variantId }: ManageVariantProps) {
  const router = useRouter();
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!variantId && variantId > 0;
  const listUrl = `/admin/products/variants/${productId}`;

  const createVariant = useCreateProductVariant();
  const updateVariant = useUpdateProductVariant();

  // The list carries every field we need (incl. images), so we resolve the variant from it
  // rather than adding a dedicated get-by-id endpoint. It also tells us if this is the first.
  const { data: variantsResponse, isLoading: isFetching } = useGetProductVariants(productId, { recordPerPage: 200 }, productId > 0);
  const allVariants = useMemo(() => variantsResponse?.data?.data?.data ?? [], [variantsResponse]);
  const variant = isEdit ? (allVariants.find((v) => v.id === variantId) ?? null) : null;
  const isFirstVariant = !isEdit && allVariants.length === 0;

  // `showAllRecords` matters: without it the list stops at the API's default ten records.
  const { data: attributesResponse } = useGetAllMasterAttributes({ showAllRecords: true, status: StatusValues.Published });
  const masterAttributes = useMemo(() => attributesResponse?.data?.data?.data ?? [], [attributesResponse]);
  const attributeItems = useMemo(() => masterAttributes.map((attribute) => ({ label: attribute.name, value: attribute.code })), [masterAttributes]);

  const schema = useMemo(() => getProductVariantSchema(isFirstVariant, isEdit), [isFirstVariant, isEdit]);

  const form = useForm<VariantFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const { control, handleSubmit, reset, setValue, watch, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'rows' });

  // Populate the form once the variant and master options have loaded (edit only). Stored
  // attribute keys are lower-cased master codes, so map each back to drive the pickers.
  useEffect(() => {
    if (!isEdit || !variant || masterAttributes.length === 0) return;
    const attrs = variant.attributes && typeof variant.attributes === 'object' ? variant.attributes : {};
    const rows = Object.entries(attrs).map(([key, value]) => {
      const master = masterAttributes.find((m) => m.code.toLowerCase() === String(key).toLowerCase());
      return { code: master ? master.code : String(key).toUpperCase(), value: String(value) };
    });
    reset({
      name: variant.name ?? '',
      sku: variant.sku,
      barcode: variant.barcode ?? '',
      images: variant.images ?? [],
      lowStockThreshold: variant.lowStockThreshold ?? undefined,
      isActive: variant.isActive ?? true,
      stockQuantity: variant.stockQuantity ?? undefined,
      sellingPrice: variant.sellingPrice ?? undefined,
      costPrice: variant.costPrice ?? undefined,
      effectiveFrom: null,
      reason: '',
      rows: rows.length ? rows : [emptyRow],
    });
  }, [isEdit, variant, masterAttributes, reset]);

  // Watched so the margin badge and the per-row value picker react as the user types.
  const rows = watch('rows');
  const sellingPrice = watch('sellingPrice');
  const costPrice = watch('costPrice');

  const margin =
    sellingPrice != null && costPrice != null && Number(sellingPrice) > 0
      ? ((Number(sellingPrice) - Number(costPrice)) / Number(sellingPrice)) * 100
      : null;

  const toUpdateModel = (model: VariantFormValues): UpdateProductVariantModel => ({
    name: trimmed(model.name) ?? null,
    barcode: trimmed(model.barcode) ?? null,
    attributes: rowsToAttributes(model.rows),
    images: model.images ?? [],
    lowStockThreshold: model.lowStockThreshold ?? null,
    isActive: model.isActive ?? true,
    // Sent every time; the API only appends a price / books stock when it changed.
    ...(model.sellingPrice != null && { sellingPrice: Number(model.sellingPrice) }),
    costPrice: model.costPrice ?? null,
    ...(model.effectiveFrom && { effectiveFrom: model.effectiveFrom.toISOString() }),
    ...(model.stockQuantity != null && { stockQuantity: Number(model.stockQuantity) }),
    ...(trimmed(model.sku) && { sku: trimmed(model.sku) }),
    ...(trimmed(model.reason) && { reason: trimmed(model.reason) }),
  });

  const toCreateModel = (model: VariantFormValues): CreateProductVariantModel => ({
    productId,
    attributes: rowsToAttributes(model.rows),
    sellingPrice: Number(model.sellingPrice),
    // A sibling variant must not retire the product's other variants.
    supersedePrevious: false,
    images: model.images ?? [],
    ...(trimmed(model.name) && { name: trimmed(model.name) }),
    ...(trimmed(model.sku) && { sku: trimmed(model.sku) }),
    ...(model.stockQuantity != null && { stockQuantity: Number(model.stockQuantity) }),
    ...(model.costPrice != null && { costPrice: Number(model.costPrice) }),
    ...(model.effectiveFrom && { effectiveFrom: model.effectiveFrom.toISOString() }),
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
        router.push(listUrl);
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

  // Number input change → number | undefined (empty string clears the field).
  const intChange = (raw: string) => (raw === '' ? undefined : parseInt(raw, 10));

  // Editing a variant that has not loaded yet (or does not exist).
  if (isEdit && isFetching && !variant) {
    return (
      <Card>
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading variant…
        </div>
      </Card>
    );
  }
  if (isEdit && !isFetching && !variant) {
    return (
      <Card>
        <div className="space-y-3 py-16 text-center">
          <p className="text-sm text-muted-foreground">This variant could not be found.</p>
          <Button type="button" variant="outline" onClick={() => router.push(listUrl)}>
            Back to variants
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form autoComplete="off" onSubmit={handleSubmit(submitData)} className="space-y-4">
        {/* Identity: what this variant is and how it is told apart from its siblings. */}
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
                <FormLabel>Attributes {isEdit || isFirstVariant ? <span className="font-normal text-muted-foreground">(optional)</span> : '*'}</FormLabel>
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
                        disabled={fields.length === 1 && !isFirstVariant && !isEdit}
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

        {/* Pricing: filed in the ledger, never overwritten. */}
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
                  name="effectiveFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isEdit ? 'New price effective from' : 'Price effective from'}</FormLabel>
                      <FormControl>
                        {/* "Effective from" is a single date; only the range's `from` is meaningful here. */}
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
              </div>
            </div>
          </FormSection>
        </Card>

        {/* Inventory: stock is the sum of its movements; the form books one. */}
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
                      <Input type="number" min={0} step={1} placeholder="0" value={field.value ?? ''} onChange={(e) => field.onChange(intChange(e.target.value))} />
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
                      <Input type="number" min={0} step={1} placeholder="5" value={field.value ?? ''} onChange={(e) => field.onChange(intChange(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </FormSection>
        </Card>

        {/* Media */}
        <Card>
          <FormSection icon={ImageIcon} title="Media" description="Photos specific to this variant. The product's own images are used when none are set.">
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

        {/* Status + audit note */}
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

        {/* Actions */}
        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-border bg-background/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-5">
          <Button type="button" variant="outline" onClick={() => router.push(listUrl)} disabled={isLoading}>
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
