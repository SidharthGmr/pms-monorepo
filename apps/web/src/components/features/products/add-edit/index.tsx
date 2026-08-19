'use client';
import { SelectSearch } from '@/components/common/select-search';
import { ProductImageUploader } from '@/components/common/admin-media/product-image-uploader';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { StatusValues } from '@/enums/status-values.enum';
import { useGetAllAttributes } from '@/hooks/service-hooks/useAttributeService';
import { useGetAllBrandNames } from '@/hooks/service-hooks/useBrandNameService';
import { useGetAllCategories } from '@/hooks/service-hooks/useCategoryService';
import { useCreateProduct, useGetAllProducts, useGetProductById, useUpdateProduct } from '@/hooks/service-hooks/useProductService';
import { CreateProductModel } from '@/models/product.model';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { productFields } from '@pms/types';
import { zodResolver } from '@/lib/zod-resolver';
import { Boxes, ImageIcon, Layers } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/card';

interface ManageProductProps {
  id: number;
}

// `productFields` carries price/cost/stock; the API turns them into the product's
// initial ProductVariant and opening stock movement.
const productFormSchema = productFields;

/** A titled group of related fields, with a leading icon and helper text. */
function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

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

  const form = useForm<CreateProductModel>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      parentId: undefined,
      categoryId: 0,
      // Brand and attribute are nullable on the product, so they start empty rather
      // than at 0 - which would fail validation while looking like "nothing chosen".
      brandNameId: undefined,
      attributeId: undefined,
      name: '',
      slug: '',
      description: '',
      displayOrder: 0,
      status: StatusValues.Published,
    },
  });

  const { handleSubmit, reset, setValue, getValues } = form;

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

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
        categoryId: p.categoryId,
        brandNameId: p.brandNameId ?? undefined,
        attributeId: p.attributeId ?? undefined,
        displayOrder: p.displayOrder ?? undefined,
        images: p.images ?? [],
        status: p.status,
      });
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

  const isLoading = createProduct.isPending || updateProduct.isPending || isFetching;

  const categoryItems = getAllCategories?.data?.data?.data?.data?.map((item) => ({ value: item.id, label: item.name })) ?? [];
  const brandItems = getAllBrandNames?.data?.data?.data?.data?.map((item) => ({ value: item.id, label: item.name })) ?? [];
  const attributeItems = (getAllAttributes?.data?.data?.data?.data ?? []).map((item) => ({ value: item.id, label: item.name }));
  const parentItems = getAllProducts?.data?.data?.data?.data?.map((item) => ({ value: item.id, label: item.name })) ?? [];

  // Number input change → number | undefined (empty string clears the field).
  const numberChange = (raw: string) => (raw === '' ? undefined : +raw);

  return (
    <Form {...form}>
      <form autoComplete="off" onSubmit={handleSubmit(submitData)} className="space-y-4">
        {/* Creating a product is a two-step job - it is not sellable until it has a variant -
            so the form says so up front instead of leaving the second step to be discovered. */}
        {!isEdit && (
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-2 font-medium text-foreground">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
              Product details
            </span>
            <Separator className="w-8" />
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="grid h-6 w-6 place-items-center rounded-full border border-border text-xs font-bold">2</span>
              Variants &amp; pricing
            </span>
          </div>
        )}
        <Card className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 ">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Product name"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        if (!isEdit || !getValues('slug')) {
                          setValue('slug', generateSlug(e.target.value), { shouldValidate: true });
                        }
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
                  <FormLabel>Slug *</FormLabel>
                  <FormControl>
                    <Input placeholder="product-slug" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 ">
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent product</FormLabel>
                  <FormControl>
                    <SelectSearch
                      buttonClass="w-full"
                      placeholder="Select parent product"
                      disableSearch
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
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <FormControl>
                    <SelectSearch
                      buttonClass="w-full"
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
              name="brandNameId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <FormControl>
                    <SelectSearch
                      buttonClass="w-full"
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
                      buttonClass="w-full"
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
          </div>
        </Card>
        {isEdit && (
          <Card>
            <Section
              icon={Boxes}
              title="Pricing & inventory"
              description="Price and stock are held per variant, so they are managed on the variant screens rather than here."
            >
              <div className="flex flex-wrap gap-2">
                <Button asChild type="button" variant="outline" size="sm">
                  <Link href={`/admin/products/variants/${id}`}>
                    <Layers className="mr-2 h-4 w-4" />
                    Variants &amp; stock
                  </Link>
                </Button>
                <Button asChild type="button" variant="outline" size="sm">
                  <Link href={`/admin/price-histories?productId=${id}`}>Price history</Link>
                </Button>
              </div>
            </Section>
          </Card>
        )}
        <Card>
          <Section icon={ImageIcon} title="Media" description="Upload product photos. The first image is used as the primary thumbnail.">
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
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Product description…" className="resize-none" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Section>
        </Card>

        <Card>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <FormControl>
                    <SelectSearch
                      placeholder="Select status"
                      buttonClass="w-full"
                      disableSearch
                      items={[
                        { label: 'Published', value: StatusValues.Published },
                        { label: 'Draft', value: StatusValues.Draft },
                      ]}
                      value={field.value}
                      valueType="string"
                      containerName="product-status"
                      onChange={(value) => field.onChange(value)}
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
        </Card>

        {/* Actions */}
        <div className="sticky bottom-0  flex items-center justify-end gap-2 border-t border-border bg-background/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80   md:px-5">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            {isEdit ? 'Update Product' : 'Create & continue'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
