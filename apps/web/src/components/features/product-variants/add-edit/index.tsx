'use client';
import { ProductImageUploader } from '@/components/common/admin-media/product-image-uploader';
import ConfirmBox from '@/components/common/confirm-box';
import OptionalSection from '@/components/common/optional-section';
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
import { useGetAllMasterAttributes, useGetAllMasterEntries } from '@/hooks/service-hooks/useMasterEntryService';
import { useGetAllProducts, useGetProductById } from '@/hooks/service-hooks/useProductService';
import { useCreateProductVariant, useGetProductVariantById, useUpdateProductVariant } from '@/hooks/service-hooks/useProductVariantService';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';
import { submitOnCtrlEnter } from '@/lib/form-shortcuts';
import { cn } from '@/lib/utils';
import { zodResolver } from '@/lib/zod-resolver';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import {
  MasterAttributeDto,
  ProductVariantCreateRequest,
  ProductVariantModel,
  ProductVariantUpdateRequest,
  productVariantValidator,
  StatusValues,
} from '@pms/types';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useFormContext } from 'react-hook-form';
import VariantRating from '../variant-rating';
import AttributeRows, { toAttributeRows } from './attribute-rows';

interface ManageVariantProps {
  id?: number;
  productId?: number;
  /** Set when the form is opened inline (dialog/panel), so Cancel just closes it. */
  onCancel?: () => void;
  /** Set when the form is opened inline, so a save closes it instead of navigating away. */
  onSaved?: () => void;
}

const LIST_URL = '/admin/products/variants';

/**
 * Create/edit form for a variant. The component keeps only data fetching, form wiring and the
 * submit/leave flow; every field group below it is a small `useFormContext` component, so a
 * keystroke in one group does not re-render the whole form.
 */
export default function ManageVariant({ id, productId, onCancel, onSaved }: ManageVariantProps) {
  const router = useRouter();
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;
  const isInline = !!onCancel;
  const [optionalOpen, setOptionalOpen] = useState(false);
  const createMutation = useCreateProductVariant();
  const updateMutation = useUpdateProductVariant();

  const { data: getVariantResponse, isLoading: isFetching, isError } = useGetProductVariantById(id ?? 0, isEdit);
  const variant = getVariantResponse?.data?.data;

  // Opened from a product page the product is fixed, so one product is fetched for its name and
  // the full catalogue list is skipped; edit mode shows the stored product and needs neither.
  const lockedProductId = !isEdit && productId && productId > 0 ? productId : undefined;
  const { data: getLockedProductResponse } = useGetProductById(lockedProductId ?? 0, !!lockedProductId);
  const lockedProduct = getLockedProductResponse?.data?.data;

  const { data: getProductsResponse } = useGetAllProducts({ showAllRecords: true }, !isEdit && !lockedProductId);
  const productItems = useMemo(
    () => (getProductsResponse?.data?.data?.data ?? []).map((product) => ({ value: product.id, label: product.name })),
    [getProductsResponse]
  );

  const { data: getAttributesResponse } = useGetAllMasterAttributes({ showAllRecords: true, status: StatusValues.Published });
  const masterAttributes = useMemo(() => getAttributesResponse?.data?.data?.data ?? [], [getAttributesResponse]);

  const { data: getEntriesResponse } = useGetAllMasterEntries({ showAllRecords: true, status: StatusValues.Published });
  const masterEntries = useMemo(() => getEntriesResponse?.data?.data?.data ?? [], [getEntriesResponse]);

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // isActive starts false so a new variant lands as the schema defaults it: Draft and not yet
  // sellable. Activation lives on the variant's own page.
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
      isActive: false,
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
      isActive: variant.isActive ?? false,
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

  const onSubmit = form.handleSubmit(submitData);

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

  return (
    <>
      <Form {...form}>
        <form
          autoComplete="off"
          onSubmit={onSubmit}
          onKeyDown={submitOnCtrlEnter(onSubmit)}
          className={cn('flex flex-col', !isInline && 'rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm')}
        >
          <div className={cn('space-y-5', !isInline && 'px-4 py-5 sm:px-5')}>
            {isEdit ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border bg-muted/30 px-3 py-2.5">
                <span className="text-sm font-medium">{variant?.product?.name ?? '—'}</span>
                {variant?.sku && <code className="font-mono text-xs text-muted-foreground">{variant.sku}</code>}
                {/* Rating posts immediately - it is its own endpoint, not part of this form's submit. */}
                {variant && (
                  <VariantRating
                    variantId={variant.id}
                    rating={variant.rating}
                    ratingCount={variant.ratingCount}
                    interactive
                    size="md"
                    className="ml-auto"
                  />
                )}
              </div>
            ) : lockedProductId ? (
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border bg-muted/30 px-3 py-2.5">
                <span className="text-sm font-medium">{lockedProduct?.name ?? 'Loading product…'}</span>
                <span className="text-[11px] text-muted-foreground">New variant for this product</span>
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

            {isEdit ? <NameDescriptionFields /> : <OptionsBox masterAttributes={masterAttributes} />}

            <PriceFields />
            <OfferFields />
            <MediaField />

            <OptionalSection title="Stock & more" open={optionalOpen} onOpenChange={setOptionalOpen}>
              {isEdit && <AttributeRows masterAttributes={masterAttributes} />}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {isEdit && (
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
                )}

                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barcode</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Barcode"
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
                  name="stockQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isEdit ? 'On-hand stock' : 'Opening stock'}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="0"
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
            </OptionalSection>
          </div>

          <div className="flex flex-col-reverse justify-end gap-2 border-t bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              {isEdit ? 'Save changes' : 'Create variant'}
            </Button>
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

/* ------------------------------ Field groups ------------------------------ */
/* Each group pulls the form from context and watches only what it displays. */

function NameDescriptionFields() {
  const form = useFormContext<ProductVariantModel>();
  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Variant name *</FormLabel>
            <FormControl>
              <Input placeholder='e.g. 64GB / 4GB / 4.5"' {...field} value={field.value ?? ''} />
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
              <Textarea
                placeholder="What makes this variant distinct - fabric, capacity, finish."
                rows={3}
                className="resize-y"
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

function OptionsBox({ masterAttributes }: { masterAttributes: MasterAttributeDto[] }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      {/* <p className="text-sm font-semibold leading-tight">Options</p>
      <p className="mb-3 mt-0.5 text-[11px] text-muted-foreground">
        The variant&rsquo;s name and SKU are generated from the product and the options picked here.
      </p> */}
      <AttributeRows masterAttributes={masterAttributes} />
    </div>
  );
}

function PriceFields() {
  const form = useFormContext<ProductVariantModel>();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
        control={form.control}
        name="stockQuantity"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Opening stock</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function OfferFields() {
  const form = useFormContext<ProductVariantModel>();
  const isOffer = form.watch('isOffer');
  const effectiveTo = form.watch('effectiveTo');

  return (
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
            <p className="text-[11px] text-amber-700 dark:text-amber-400 sm:col-span-3">
              After this date the variant has no price and cannot be bought.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function MediaField() {
  const form = useFormContext<ProductVariantModel>();
  return (
    <FormField
      control={form.control}
      name="images"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Images *</FormLabel>
          <FormControl>
            <ProductImageUploader value={field.value || []} onChange={field.onChange} folder="product-variants" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
