'use client';
import { ProductImageUploader } from '@/components/common/admin-media/product-image-uploader';
import ConfirmBox from '@/components/common/confirm-box';
import { SelectSearch } from '@/components/common/select-search';
import StatusCards from '@/components/common/status-cards';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { StatusValues } from '@/enums/status-values.enum';
import { useGetAllAttributes } from '@/hooks/service-hooks/useAttributeService';
import { useGetAllBrandNames } from '@/hooks/service-hooks/useBrandNameService';
import { useGetAllCategories } from '@/hooks/service-hooks/useCategoryService';
import { useCreateProduct, useGetAllProducts, useGetProductById, useUpdateProduct } from '@/hooks/service-hooks/useProductService';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';
import { cn } from '@/lib/utils';
import { zodResolver } from '@/lib/zod-resolver';
import { CreateProductModel } from '@/models/product.model';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { productFields } from '@pms/types';
import { ArrowLeft, ChevronDown, History, Layers, Link2, Package, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyboardEvent, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

interface ManageProductProps {
  id: number;
  /** Set when the form is shown inside the product page, so Cancel returns to the details instead of the list. */
  onCancel?: () => void;
  /** Set when the form is shown inside the product page, so a save returns to the details instead of the list. */
  onSaved?: () => void;
  /** What the inline back link says, since the form is hosted by both the product page and the list. */
  backLabel?: string;
}

// `productFields` carries price/cost/stock; the API turns them into the product's
// initial ProductVariant and opening stock movement.
const productFormSchema = productFields;

const DEFAULT_VALUES: CreateProductModel = {
  parentId: undefined,
  categoryId: 0,
  brandNameId: undefined,
  attributeId: undefined,
  name: '',
  slug: '',
  description: '',
  displayOrder: undefined,
  images: [],
  status: StatusValues.Published,
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
  const getAllAttributes = useGetAllAttributes({ showAllRecords: true });
  const getAllProducts = useGetAllProducts({ showAllRecords: true });

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { data: productResponse, isLoading: isFetching, isError: fetchFailed } = useGetProductById(id ?? 0, isEdit);

  // The slug follows the name until the user edits it by hand; the refresh button re-links them.
  const [slugTouched, setSlugTouched] = useState(false);
  const [optionalOpen, setOptionalOpen] = useState(false);
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
        attributeId: p.attribute?.id ?? undefined,
        displayOrder: p.displayOrder ?? undefined,
        images: p.images ?? [],
        status: p.status,
      });
      setSlugTouched(true);
    }
  }, [isEdit, productResponse, reset]);

  const submitData = async (model: CreateProductModel) => {
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
      toast({
        variant: 'success',
        title: 'Product created',
        description: <span>Now add its first variant so it can be sold.</span>,
      });
      router.push(newId > 0 ? `/admin/products/${newId}/variants?new=1` : '/admin/products');
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  };

  // Several fields live behind the disclosure; if one of them blocks the save, it must unfold
  // so the message is visible instead of the form refusing silently.
  const onSubmit = handleSubmit(submitData, (errors) => {
    if (errors.description || errors.images || errors.brandNameId || errors.attributeId || errors.parentId || errors.displayOrder)
      setOptionalOpen(true);
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

  // Ctrl/Cmd+Enter saves from anywhere in the form, so a keyboard user never has to reach the footer.
  const onFormKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  const categoryItems = useMemo(
    () => getAllCategories?.data?.data?.data?.data?.map((item) => ({ value: item.id, label: item.name })) ?? [],
    [getAllCategories.data]
  );
  const brandItems = useMemo(
    () => getAllBrandNames?.data?.data?.data?.data?.map((item) => ({ value: item.id, label: item.name })) ?? [],
    [getAllBrandNames.data]
  );
  const attributeItems = useMemo(
    () => (getAllAttributes?.data?.data?.data?.data ?? []).map((item) => ({ value: item.id, label: item.name })),
    [getAllAttributes.data]
  );
  // A product cannot be its own parent.
  const parentItems = useMemo(
    () => (getAllProducts?.data?.data?.data?.data ?? []).filter((item) => item.id !== id).map((item) => ({ value: item.id, label: item.name })),
    [getAllProducts.data, id]
  );

  const images = form.watch('images') ?? [];
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
    images.length > 0 ? `${images.length} ${images.length === 1 ? 'image' : 'images'}` : null,
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
                  <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
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
              <Link href={`/admin/product-variants/price-histories?productId=${id}`}>
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
            <form autoComplete="off" onSubmit={onSubmit} onKeyDown={onFormKeyDown} className="flex flex-col">
              <div className="space-y-5 px-5 py-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Air Zoom Runner"
                          autoFocus={!isEdit}
                          className="h-10"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (!slugTouched) setValue('slug', generateSlug(e.target.value), { shouldValidate: true });
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
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
                      <FormLabel>Status *</FormLabel>
                      <FormControl>
                        <StatusCards value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <section className="overflow-hidden rounded-xl border">
                  <button
                    type="button"
                    onClick={() => setOptionalOpen((open) => !open)}
                    aria-expanded={optionalOpen}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                  >
                    <span className="min-w-0 flex-1 text-sm font-semibold leading-tight">Images, brand &amp; more</span>
                    {!optionalOpen && optionalSummary && (
                      <span className="hidden truncate text-[11px] text-muted-foreground sm:inline">{optionalSummary}</span>
                    )}
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Optional
                    </span>
                    <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', optionalOpen && 'rotate-180')} />
                  </button>

                  {optionalOpen && (
                    <div className="space-y-5 border-t px-4 py-4">
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

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                          name="attributeId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Attribute</FormLabel>
                              <FormControl>
                                <SelectSearch
                                  buttonClass="h-10 w-full"
                                  placeholder="Select attribute"
                                  items={attributeItems}
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
                                  className="h-10"
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
                    </div>
                  )}
                </section>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t bg-muted/30 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p
                  className={cn(
                    'hidden items-center gap-1.5 text-xs sm:flex',
                    isDirty ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'
                  )}
                >
                  {isDirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                  {isDirty ? 'Unsaved changes' : 'No changes yet'}
                </p>
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button type="submit" className="gap-1.5" loading={isSaving}>
                    {isEdit ? 'Save changes' : 'Create & add variants'}
                    {!isEdit && !isSaving && <Layers className="h-4 w-4" />}
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
