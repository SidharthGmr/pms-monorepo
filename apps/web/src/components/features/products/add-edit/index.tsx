'use client';
import { ProductImageUploader } from '@/components/common/admin-media/product-image-uploader';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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
import { CreateProductModel } from '@/models/product.model';
import { cn } from '@/lib/utils';
import { zodResolver } from '@/lib/zod-resolver';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { productFields } from '@pms/types';
import { ArrowLeft, Boxes, Check, Eye, EyeOff, FolderTree, History, ImageIcon, Layers, Link2, Package, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

interface ManageProductProps {
  id: number;
}

const SURFACE = 'rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm';

// `productFields` carries price/cost/stock; the API turns them into the product's
// initial ProductVariant and opening stock movement.
const productFormSchema = productFields;

const STATUS_OPTIONS = [
  {
    value: StatusValues.Published,
    label: 'Published',
    hint: 'Listed in the store once it has an active variant.',
    icon: Eye,
    active: 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20',
    iconActive: 'bg-emerald-500 text-white',
    iconIdle: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    check: 'bg-emerald-500',
  },
  {
    value: StatusValues.Draft,
    label: 'Draft',
    hint: 'Hidden from the store until you publish it.',
    icon: EyeOff,
    active: 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20',
    iconActive: 'bg-amber-500 text-white',
    iconIdle: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    check: 'bg-amber-500',
  },
];

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export default function ManageProduct({ id }: ManageProductProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const router = useRouter();
  const isEdit = !!id && id > 0;

  // `showAllRecords` matters: without it these lists stop at the API's default ten records,
  // and a category created eleventh simply cannot be picked.
  const getAllCategories = useGetAllCategories({ showAllRecords: true });
  const getAllBrandNames = useGetAllBrandNames({ showAllRecords: true });
  const getAllAttributes = useGetAllAttributes({ showAllRecords: true });
  const getAllProducts = useGetAllProducts({ showAllRecords: true });

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { data: productResponse, isLoading: isFetching } = useGetProductById(id ?? 0, isEdit);

  // The slug follows the name until the user edits it by hand; the refresh button re-links them.
  const [slugTouched, setSlugTouched] = useState(false);

  const form = useForm<CreateProductModel>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      parentId: undefined,
      categoryId: 0,
      brandNameId: undefined,
      attributeId: undefined,
      name: '',
      slug: '',
      description: '',
      displayOrder: 0,
      status: StatusValues.Published,
    },
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
        router.push('/admin/products');
        return;
      }

      // A product with no variant cannot be sold, so creating one hands straight over to
      // the variant screen rather than dropping the user back on the list to find it.
      const newId = Number((response.data as { data?: { id?: number } })?.data?.id);
      toast({
        variant: 'success',
        title: 'Product created',
        description: <span>Now add its first variant so it can be sold.</span>,
      });
      router.push(newId > 0 ? `/admin/products/variants/${newId}?new=1` : '/admin/products');
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  };

  const isSaving = createProduct.isPending || updateProduct.isPending;
  const isLoading = isSaving || isFetching;
  useUnsavedChangesWarning(isDirty && !isSaving);

  const categoryItems = useMemo(() => getAllCategories?.data?.data?.data?.data?.map((item) => ({ value: item.id, label: item.name })) ?? [], [getAllCategories.data]);
  const brandItems = useMemo(() => getAllBrandNames?.data?.data?.data?.data?.map((item) => ({ value: item.id, label: item.name })) ?? [], [getAllBrandNames.data]);
  const attributeItems = useMemo(() => (getAllAttributes?.data?.data?.data?.data ?? []).map((item) => ({ value: item.id, label: item.name })), [getAllAttributes.data]);
  // A product cannot be its own parent.
  const parentItems = useMemo(
    () => (getAllProducts?.data?.data?.data?.data ?? []).filter((item) => item.id !== id).map((item) => ({ value: item.id, label: item.name })),
    [getAllProducts.data, id]
  );

  const name = form.watch('name') ?? '';
  const images = form.watch('images') ?? [];

  // Number input change → number | undefined (empty string clears the field).
  const numberChange = (raw: string) => (raw === '' ? undefined : +raw);

  const productName = isEdit ? productResponse?.data?.data?.name : undefined;

  return (
    <Form {...form}>
      <form autoComplete="off" onSubmit={handleSubmit(submitData)} className="space-y-4 sm:space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <Link href="/admin/products" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />
              Products
            </Link>
            <div className="mt-1 flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Package className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{isEdit ? productName || 'Edit product' : 'New product'}</h1>
                <p className="text-sm text-muted-foreground">{isEdit ? 'Update the details customers see. Price and stock live on the variants.' : 'Describe the product first; price, stock and options come next.'}</p>
              </div>
            </div>
          </div>
          {!isEdit && <Steps />}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 sm:gap-5">
          <div className="min-w-0 space-y-4 lg:col-span-2 sm:space-y-5">
            <Section icon={Package} title="Basics" hint="The name and web address of the product.">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
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
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Slug *</FormLabel>
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
                      <FormDescription className="text-xs">
                        Used in the storefront address: /products/<span className="font-mono">{field.value || 'slug'}</span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea rows={5} placeholder="What it is, what it is made of, who it is for…" className="resize-y" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Section>

            <Section icon={FolderTree} title="Organisation" hint="Where the product sits in the catalog.">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <FormControl>
                        <SelectSearch buttonClass="h-10 w-full" placeholder="Select category" items={categoryItems} value={field.value ?? ''} onChange={(value) => field.onChange(value ? Number(value) : undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="brandNameId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <FormControl>
                        <SelectSearch buttonClass="h-10 w-full" placeholder="Select brand (optional)" items={brandItems} value={field.value ?? ''} onChange={(value) => field.onChange(value ? Number(value) : undefined)} />
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
                        <SelectSearch buttonClass="h-10 w-full" placeholder="Select attribute (optional)" items={attributeItems} value={field.value ?? ''} onChange={(value) => field.onChange(value ? Number(value) : undefined)} />
                      </FormControl>
                      <FormDescription className="text-xs">A descriptive property such as Material or Fit.</FormDescription>
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
                        <SelectSearch buttonClass="h-10 w-full" placeholder="None" items={parentItems} value={field.value ?? ''} onChange={(value) => field.onChange(value ? Number(value) : undefined)} />
                      </FormControl>
                      <FormDescription className="text-xs">Only for products that belong under another one.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Section>

            {isEdit && (
              <Section icon={Boxes} title="Pricing & inventory" hint="Price and stock are held per variant, so they are managed on the variant screens.">
                <div className="flex flex-wrap gap-2">
                  <Button asChild type="button" variant="outline" size="sm" className="h-9 gap-1.5">
                    <Link href={`/admin/products/variants/${id}`}>
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
              </Section>
            )}
          </div>

          <aside className="min-w-0 space-y-4 sm:space-y-5">
            <Section icon={ImageIcon} title="Media" hint="The first image is the thumbnail.">
              <FormField
                control={form.control}
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
              {images.length > 0 && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {images.length} {images.length === 1 ? 'image' : 'images'} · drag to reorder, the first one leads.
                </p>
              )}
            </Section>

            <Section icon={Eye} title="Visibility" hint="Whether and where it shows.">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <FormControl>
                      <div className="grid gap-2" role="radiogroup" aria-label="Status">
                        {STATUS_OPTIONS.map(({ icon: Icon, ...option }) => {
                          const active = field.value === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => field.onChange(option.value)}
                              className={cn(
                                'relative flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-left transition-all',
                                'hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                active ? option.active : 'border-input hover:border-muted-foreground/40'
                              )}
                            >
                              <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', active ? option.iconActive : option.iconIdle)}>
                                <Icon className="h-4 w-4" />
                              </span>
                              <span className="min-w-0 flex-1 pr-5">
                                <span className="block text-sm font-semibold leading-tight">{option.label}</span>
                                <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{option.hint}</span>
                              </span>
                              <span aria-hidden className={cn('absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full text-white transition-all', active ? cn(option.check, 'scale-100 opacity-100') : 'scale-50 opacity-0')}>
                                <Check className="h-3 w-3" strokeWidth={3} />
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayOrder"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Display order</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" className="h-10 sm:max-w-[160px]" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(numberChange(e.target.value))} />
                    </FormControl>
                    <FormDescription className="text-xs">Lower numbers appear first in the store.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Section>
          </aside>
        </div>

        <div className="sticky bottom-0 z-30 -mx-3 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-4 lg:-mx-6">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <p className={cn('hidden items-center gap-1.5 text-xs sm:flex', isDirty ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground')}>
              {isDirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
              {isDirty ? 'Unsaved changes' : name ? `Editing “${name}”` : 'Fill in the details to continue'}
            </p>
            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
              <Button type="button" variant="outline" className="h-9" onClick={() => router.push('/admin/products')} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" className="h-9 gap-1.5" loading={isLoading}>
                {isEdit ? 'Save changes' : 'Create & add variants'}
                {!isEdit && !isLoading && <Layers className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}

// Creating a product is a two-step job: it is not sellable until it has a variant.
function Steps() {
  return (
    <ol className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
      <li className="flex items-center gap-2 text-foreground">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">1</span>
        Product details
      </li>
      <span className="h-px w-6 bg-border" aria-hidden />
      <li className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full border bg-background text-[11px] font-bold">2</span>
        Variants &amp; pricing
      </li>
    </ol>
  );
}

function Section({ icon: Icon, title, hint, children }: { icon: React.ElementType; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className={SURFACE}>
      <div className="flex items-center gap-2.5 border-b border-border/70 px-4 py-3 sm:px-5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold leading-tight">{title}</h2>
          {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
        </div>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
