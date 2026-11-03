'use client';
import { ProductImageUploader } from '@/components/common/admin-media/product-image-uploader';
import ConfirmBox from '@/components/common/confirm-box';
import OptionalSection from '@/components/common/optional-section';
import { CurrencyInput } from '@/components/common/currency-input';
import { DateRangePicker } from '@/components/common/date-range-picker';
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
import { useCreateProductVariant, useGetProductVariantById, useUpdateProductVariant } from '@/hooks/service-hooks/useProductVariantService';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';
import { submitOnCtrlEnter } from '@/lib/form-shortcuts';
import { cn } from '@/lib/utils';
import { zodResolver } from '@/lib/zod-resolver';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import {
  ProductVariantCreateRequest,
  ProductVariantModel,
  ProductVariantUpdateRequest,
  productVariantFormFields,
  StatusValues,
} from '@pms/types';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import AttributeRows, { toAttributeRows } from './attribute-rows';

interface ManageVariantProps {
  id?: number;
  productId?: number;
  onCancel?: () => void;
  onSaved?: () => void;
}

const LIST_URL = '/admin/products/variants';

export default function ManageVariant({ id, productId, onCancel, onSaved }: ManageVariantProps) {
  const router = useRouter();
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;
  const isInline = !!onCancel;
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [attributesOpen, setAttributesOpen] = useState(false);
  const createMutation = useCreateProductVariant();
  const updateMutation = useUpdateProductVariant();

  const { data: getVariantResponse, isLoading: isFetching, isError } = useGetProductVariantById(id ?? 0, isEdit);
  const variant = getVariantResponse?.data?.data;

  const { data: getAttributesResponse } = useGetAllMasterAttributes({ showAllRecords: true, status: StatusValues.Published });
  const masterAttributes = useMemo(() => getAttributesResponse?.data?.data?.data ?? [], [getAttributesResponse]);

  const { data: getEntriesResponse } = useGetAllMasterEntries({ showAllRecords: true, status: StatusValues.Published });
  const masterEntries = useMemo(() => getEntriesResponse?.data?.data?.data ?? [], [getEntriesResponse]);

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // isActive starts false so a new variant lands as the schema defaults it: Draft and not yet
  // sellable. Activation lives on the variant's own page.
  const form = useForm<ProductVariantModel>({
    resolver: zodResolver(productVariantFormFields),
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
  const isOffer = form.watch('isOffer');
  const effectiveTo = form.watch('effectiveTo');

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
          <div className={cn('space-y-4', !isInline && 'px-4 py-5 sm:px-5')}>

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
                    <FormLabel>Cost price*</FormLabel>
                    <FormControl>
                      <CurrencyInput value={field.value ?? ''} onChange={(value) => field.onChange(value === '' ? null : value)} />
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

            <OptionalSection title="Attributes & options" open={attributesOpen} onOpenChange={setAttributesOpen}>
              <AttributeRows masterAttributes={masterAttributes} />
            </OptionalSection>

            <OptionalSection title="Stock & more" open={optionalOpen} onOpenChange={setOptionalOpen}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                <FormField
                  control={form.control}
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
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
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g. New colourway for spring" rows={1} className="resize-none" {...field} value={field.value ?? ''} />
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
