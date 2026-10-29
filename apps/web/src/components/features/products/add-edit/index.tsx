'use client';
import { ProductImageUploader } from '@/components/common/admin-media/product-image-uploader';
import { submitOnCtrlEnter } from '@/lib/form-shortcuts';
import ConfirmBox from '@/components/common/confirm-box';
import { DateRangePicker } from '@/components/common/date-range-picker';
import { PriceInput } from '@/components/common/price-input';
import { SelectSearch } from '@/components/common/select-search';
import { DirtyNote } from '@/components/common/field';
import OptionalSection from '@/components/common/optional-section';
import StatusSwitch from '@/components/common/status-switch';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';

import { useGetAllBrandNames } from '@/hooks/service-hooks/useBrandNameService';
import { useGetAllCategories } from '@/hooks/service-hooks/useCategoryService';
import { useGetAllMasterAttributes } from '@/hooks/service-hooks/useMasterEntryService';
import { useGetProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { useCreateProduct, useGetAllProducts, useGetProductById, useUpdateProduct } from '@/hooks/service-hooks/useProductService';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';
import { zodResolver } from '@/lib/zod-resolver';

import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { productFormFields, StatusValues, CreateProductModel } from '@pms/types';
import { ArrowLeft, History, Layers, Link2, Package, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import VariantOptionRows from './variant-option-rows';

interface ManageProductProps {
  id: number;
  /** Set when the form is shown inside the product page, so Cancel returns to the details instead of the list. */
  onCancel?: () => void;
  /** Set when the form is shown inside the product page, so a save returns to the details instead of the list. */
  onSaved?: () => void;
  /** What the inline back link says, since the form is hosted by both the product page and the list. */
  backLabel?: string;
}

// Creating a product also creates its variants: each row below becomes a ProductVariant with
// an opening PriceHistory entry and stock movement, written in the same API transaction.
const productFormSchema = productFormFields;

const EMPTY_VARIANT_ROW = {
  attributes: [],
  sellingPrice: undefined as unknown as number,
  offerPrice: undefined,
  costPrice: undefined,
  stockQuantity: undefined,
  isOffer: false,
  effectiveFrom: undefined,
  effectiveTo: null,
};

const DEFAULT_VALUES: CreateProductModel = {
  parentId: undefined,
  categoryId: 0,
  brandNameId: undefined,
  name: '',
  slug: '',
  description: '',
  displayOrder: undefined,
  images: [],
  status: StatusValues.Published,
  variants: [EMPTY_VARIANT_ROW],
};

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export default function ManageProduct({ id, onCancel, onSaved, backLabel = 'Back to details' }: ManageProductProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const router = useRouter();
  const isEdit = !!id && id > 0;
  const isInline = !!onCancel;

  // `showAllRecords` matters: without it these lists stop at the API's default ten records,
  // and a category created eleventh simply cannot be picked.
  const getAllCategories = useGetAllCategories({ showAllRecords: true });
  const getAllBrandNames = useGetAllBrandNames({ showAllRecords: true });
  const getAllProducts = useGetAllProducts({ showAllRecords: true });
  const getAllMasterAttributes = useGetAllMasterAttributes({ showAllRecords: true, status: StatusValues.Published }, !isEdit);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { data: productResponse, isLoading: isFetching, isError: fetchFailed } = useGetProductById(id ?? 0, isEdit);

  // The slug follows the name until the user edits it by hand; the refresh button re-links them.
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugOpen, setSlugOpen] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const form = useForm<CreateProductModel>({
    resolver: zodResolver(productFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const {
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { isDirty },
  } = form;

  const variantRows = useFieldArray({ control: form.control, name: 'variants', keyName: 'fieldKey' });
  const getVariantsResponse = useGetProductVariants(id ?? 0, { recordPerPage: 100 }, isEdit);

  useEffect(() => {
    if (isEdit && productResponse?.data?.data) {
      const p = productResponse.data.data;
      // Price and stock are deliberately absent: they belong to variants, so the form
      // must not send them back and quietly rewrite the default variant's ledger.
      reset({
        name: p.name,
        slug: p.slug,
        description: p.description ?? '',
        parentId: p.parentId ?? undefined,
        categoryId: p.category?.id,
        brandNameId: p.brandName?.id ?? undefined,
        displayOrder: p.displayOrder ?? undefined,
        images: p.images ?? [],
        status: p.status,
      });
      setSlugTouched(true);
    }
  }, [isEdit, productResponse, reset]);

  // Existing variants arrive separately from the product; they slot into the same rows the
  // create form uses. Blank offer start dates mean "unchanged" - the API appends a ledger row
  // only when a price field actually differs. isDirty keeps a background refetch from
  // overwriting rows the admin is editing.
  const variantRecords = getVariantsResponse.data?.data?.data?.data;
  useEffect(() => {
    if (!isEdit || !variantRecords || form.formState.isDirty) return;
    form.setValue(
      'variants',
      variantRecords.map((variant) => ({
        id: variant.id,
        attributes: Array.isArray(variant.attributes)
          ? (variant.attributes as { attributeid?: number; attributeValueId?: number }[])
              .filter((row) => row?.attributeid != null && row?.attributeValueId != null)
              .map((row) => ({ attributeid: row.attributeid as number, attributeValueId: row.attributeValueId as number }))
          : [],
        sellingPrice: variant.sellingPrice ?? (undefined as unknown as number),
        offerPrice: variant.offerPrice ?? undefined,
        costPrice: variant.costPrice ?? undefined,
        stockQuantity: variant.stockQuantity ?? undefined,
        isOffer: variant.isOffer ?? false,
        effectiveFrom: undefined,
        effectiveTo: undefined,
      }))
    );
  }, [isEdit, variantRecords, form]);

  const submitData = async (formValues: CreateProductModel) => {
    // An option row the admin never touched means "no option", so it is dropped rather than
    // sent as a half-empty pair the API would reject.
    const model: CreateProductModel = {
      ...formValues,
      ...(formValues.variants && {
        variants: formValues.variants.map((variant) => ({
          ...variant,
          attributes: (variant.attributes ?? []).filter((option) => option?.attributeid != null && option?.attributeValueId != null),
        })),
      }),
    };

    let response;
    if (isEdit) {
      response = await updateProduct.mutateAsync({ id: id!, model });
    } else {
      response = await createProduct.mutateAsync(model);
    }

    if (response && (response.status === 200 || response.status === 201)) {
      reset(model);
      if (isEdit) {
        toast({ variant: 'success', title: 'Product updated successfully' });
        if (onSaved) onSaved();
        else router.push('/admin/products');
        return;
      }

      const newId = Number((response.data as { data?: { id?: number } })?.data?.id);
      const count = model.variants?.length ?? 1;
      toast({
        variant: 'success',
        title: 'Product created',
        description: <span>{count === 1 ? 'Its variant is priced and ready to sell.' : `All ${count} variants are priced and ready to sell.`}</span>,
      });
      router.push(newId > 0 ? `/admin/products/${newId}` : '/admin/products');
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  };

  // Several fields live behind the disclosure; if one of them blocks the save, it must unfold
  // so the message is visible instead of the form refusing silently.
  const [optionalOpen, setOptionalOpen] = useState(false);
  const onSubmit = handleSubmit(submitData, (errors) => {
    if (errors.description || errors.brandNameId || errors.parentId || errors.displayOrder) setOptionalOpen(true);
  });

  const isSaving = createProduct.isPending || updateProduct.isPending;
  useUnsavedChangesWarning(isDirty && !isSaving);

  const leave = () => {
    if (onCancel) onCancel();
    else router.push('/admin/products');
  };

  const handleCancel = () => {
    if (isDirty && !isSaving) {
      setShowLeaveConfirm(true);
      return;
    }
    leave();
  };

  const categoryItems = useMemo(
    () => getAllCategories?.data?.data?.data?.data?.map((item) => ({ value: item.id, label: item.name })) ?? [],
    [getAllCategories.data]
  );
  const brandItems = useMemo(
    () => getAllBrandNames?.data?.data?.data?.data?.map((item) => ({ value: item.id, label: item.name })) ?? [],
    [getAllBrandNames.data]
  );
  const masterAttributes = useMemo(() => getAllMasterAttributes?.data?.data?.data?.data ?? [], [getAllMasterAttributes.data]);
  // A product cannot be its own parent.
  const parentItems = useMemo(
    () => (getAllProducts?.data?.data?.data?.data ?? []).filter((item) => item.id !== id).map((item) => ({ value: item.id, label: item.name })),
    [getAllProducts.data, id]
  );

  const slugValue = form.watch('slug') ?? '';
  const description = form.watch('description') ?? '';
  const brandNameId = form.watch('brandNameId');
  const displayOrder = form.watch('displayOrder');

  // Number input change → number | undefined (empty string clears the field).
  const numberChange = (raw: string) => (raw === '' ? undefined : +raw);

  const productName = isEdit ? productResponse?.data?.data?.name : undefined;
  const thumbnail = productResponse?.data?.data?.images?.[0];
  const showSkeleton = isEdit && isFetching;

  // Keeps the stored values visible while the section is closed.
  const optionalSummary = [
    brandNameId ? (brandItems.find((item) => item.value === brandNameId)?.label ?? 'brand set') : null,
    description.trim() ? 'description' : null,
    displayOrder != null && String(displayOrder) !== '' ? `order ${displayOrder}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {isInline ? (
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {backLabel}
            </button>
          ) : (
            <Link href="/admin/products" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />
              Products
            </Link>
          )}
          <div className="mt-1 flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary">
              {thumbnail ? (
                // Product images come from arbitrary CDNs; next/image would need each host in
                // `next.config.mjs` remotePatterns, so a plain <img> keeps unknown hosts working.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbnail} alt="" className="h-full w-full object-cover" />
              ) : (
                <Package className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{isEdit ? productName || 'Edit product' : 'New product'}</h1>
                {isEdit && (
                  <span className="shrink-0 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
                    Editing
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                <kbd className="rounded border bg-background px-1 font-mono text-[10px]">Ctrl</kbd> +{' '}
                <kbd className="rounded border bg-background px-1 font-mono text-[10px]">Enter</kbd> saves.
              </p>
            </div>
          </div>
        </div>

        {isEdit && !isInline && (
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild type="button" variant="outline" size="sm" className="h-9 gap-1.5">
              <Link href={`/admin/products/${id}/variants`}>
                <Layers className="h-4 w-4" />
                Variants &amp; stock
              </Link>
            </Button>
            <Button asChild type="button" variant="outline" size="sm" className="h-9 gap-1.5">
              <Link href={`/admin/price-histories?productId=${id}`}>
                <History className="h-4 w-4" />
                Price history
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm">
        {showSkeleton ? (
          <div className="space-y-4 px-5 py-5" aria-busy="true" aria-label="Loading product">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : fetchFailed ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-semibold text-destructive">Could not load this product</p>
            <p className="mt-1 text-xs text-muted-foreground">It may have been deleted. Go back and refresh the list.</p>
          </div>
        ) : (
          <Form {...form}>
            <form autoComplete="off" onSubmit={onSubmit} onKeyDown={submitOnCtrlEnter(onSubmit)} className="flex flex-col">
              <div className="space-y-5 px-5 py-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Product name *</FormLabel>
                        {!isEdit && !slugOpen && (
                          <button
                            type="button"
                            onClick={() => setSlugOpen(true)}
                            title="Edit the URL slug"
                            className="flex min-w-0 items-center gap-1 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <span className="truncate">/products/{slugValue || 'slug'}</span>
                            <Pencil className="h-3 w-3 shrink-0" />
                          </button>
                        )}
                      </div>
                      <FormControl>
                        <Input
                          placeholder="e.g. Air Zoom Runner"
                          autoFocus={!isEdit}

                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (!slugTouched) setValue('slug', generateSlug(e.target.value), { shouldValidate: true });
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                      {!isEdit && !slugOpen && form.formState.errors.slug && (
                        <p className="text-sm font-medium text-destructive">{form.formState.errors.slug.message}</p>
                      )}
                    </FormItem>
                  )}
                />

                {(isEdit || slugOpen) && (
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Slug *</FormLabel>
                          <span className="truncate font-mono text-[11px] text-muted-foreground">/products/{field.value || 'slug'}</span>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Link2
                              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                              aria-hidden
                            />
                            <Input
                              placeholder="air-zoom-runner"
                              className="h-10 pl-9 pr-10 font-mono text-sm"
                              {...field}
                              onChange={(e) => {
                                setSlugTouched(true);
                                field.onChange(e);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setSlugTouched(false);
                                setValue('slug', generateSlug(getValues('name') ?? ''), { shouldValidate: true, shouldDirty: true });
                              }}
                              title="Regenerate from the name"
                              aria-label="Regenerate slug from the name"
                              className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <FormControl>
                          <SelectSearch
                            buttonClass="h-10 w-full"
                            placeholder="Select category"
                            items={categoryItems}
                            value={field.value ?? ''}
                            onChange={(value) => field.onChange(value ? Number(value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <StatusSwitch value={field.value} onChange={field.onChange} />
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
                      <FormLabel>Images *</FormLabel>
                      <FormControl>
                        <ProductImageUploader value={field.value || []} onChange={field.onChange} folder="products" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <section className="overflow-hidden rounded-xl border">
                  <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-4 py-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-sm font-semibold leading-tight">
                        <Layers className="h-4 w-4 text-primary" />
                        Variants &amp; pricing{isEdit ? '' : ' *'}
                      </p>
                      {/* <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Pick each variant's options and price — its name and SKU are generated from them.
                        </p> */}
                    </div>
                  </div>

                  <div className="divide-y">
                    {variantRows.fields.map((row, index) => (
                      <div key={row.fieldKey} className="relative space-y-3 p-4 pr-11">
                        {variantRows.fields.length > 1 && (
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Variant {index + 1}</p>
                        )}
                        <VariantOptionRows variantIndex={index} masterAttributes={masterAttributes} />

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          <FormField
                            control={form.control}
                            name={`variants.${index}.costPrice`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cost price</FormLabel>
                                <FormControl>
                                  <PriceInput value={field.value ?? null} onChange={field.onChange} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`variants.${index}.sellingPrice`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Selling price *</FormLabel>
                                <FormControl>
                                  <PriceInput value={field.value ?? null} onChange={field.onChange} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`variants.${index}.stockQuantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Opening stock</FormLabel>
                                <FormControl>
                                  <Input
                                    type="text"
                                    {...field}
                                    value={field.value ?? '0'}
                                    onChange={(e) => field.onChange(numberChange(e.target.value))}
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
                            name={`variants.${index}.isOffer`}
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
                                        setValue(`variants.${index}.offerPrice`, undefined);
                                        setValue(`variants.${index}.effectiveFrom`, undefined);
                                        setValue(`variants.${index}.effectiveTo`, null);
                                      }
                                    }}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {form.watch(`variants.${index}.isOffer`) && (
                            <div className="grid grid-cols-1 gap-3 border-t p-3 sm:grid-cols-3">
                              <FormField
                                control={form.control}
                                name={`variants.${index}.offerPrice`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Offer price *</FormLabel>
                                    <FormControl>
                                      <PriceInput value={field.value ?? null} onChange={field.onChange} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`variants.${index}.effectiveFrom`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Starts</FormLabel>
                                    <FormControl>
                                      <DateRangePicker
                                        value={field.value ? { from: field.value as Date } : undefined}
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
                                name={`variants.${index}.effectiveTo`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Ends</FormLabel>
                                    <FormControl>
                                      <DateRangePicker
                                        value={field.value ? { from: field.value as Date } : undefined}
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
                              {!!form.watch(`variants.${index}.effectiveTo`) && (
                                <p className="text-[11px] text-warning sm:col-span-3">
                                  After this date the variant has no price and cannot be bought.
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {variantRows.fields.length > 1 && !form.watch(`variants.${index}.id`) && (
                          <button
                            type="button"
                            onClick={() => variantRows.remove(index)}
                            aria-label={`Remove variant ${index + 1}`}
                            title="Remove this variant"
                            className="absolute right-2.5 top-2.5 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    <div className="p-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 w-full gap-1.5 border-dashed text-muted-foreground hover:text-foreground"
                        onClick={() => variantRows.append(EMPTY_VARIANT_ROW)}
                      >
                        <Plus className="h-4 w-4" />
                        Add variant
                      </Button>
                    </div>
                  </div>
                </section>

                <OptionalSection title="Brand & more" summary={optionalSummary} open={optionalOpen} onOpenChange={setOptionalOpen}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="brandNameId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brand</FormLabel>
                          <FormControl>
                            <SelectSearch
                              buttonClass="h-10 w-full"
                              placeholder="Select brand"
                              items={brandItems}
                              value={field.value ?? ''}
                              onChange={(value) => field.onChange(value ? Number(value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="parentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parent product</FormLabel>
                          <FormControl>
                            <SelectSearch
                              buttonClass="h-10 w-full"
                              placeholder="None"
                              items={parentItems}
                              value={field.value ?? ''}
                              onChange={(value) => field.onChange(value ? Number(value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="displayOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display order</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"

                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(numberChange(e.target.value))}
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
                            rows={4}
                            placeholder="What it is, what it is made of, who it is for…"
                            className="resize-y"
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </OptionalSection>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t bg-muted/30 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <DirtyNote dirty={isDirty} />
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button type="submit" className="gap-1.5" loading={isSaving}>
                    {isEdit ? 'Save changes' : 'Create product'}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        )}
      </div>

      <ConfirmBox
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onSubmit={() => {
          setShowLeaveConfirm(false);
          leave();
        }}
        heading="Discard changes?"
        bodyText="This product has unsaved changes. Leaving now will lose them."
        noButtonText="Keep editing"
        yesButtonText="Discard"
      />
    </div>
  );
}
