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
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { CreateProductModel } from '@/models/product.model';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { productFields } from '@pms/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Boxes, ImageIcon, Info, Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

interface ManageProductProps {
  id: number;
}

/**
 * The shared `productFields` schema intentionally omits price/cost/stock, so a
 * plain `zodResolver(productFields)` STRIPS them from the submitted payload.
 * Extend it locally so the values the form collects actually reach the API.
 */
const productFormSchema = productFields.extend({
  price: z.number().nonnegative('Selling price must be 0 or more'),
  cost: z.number().nonnegative('Cost must be 0 or more').nullable().optional(),
  stock: z.number().int('Enter a whole number').nonnegative('Stock must be 0 or more').nullable().optional(),
});

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
    <section className="grid grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-[240px_1fr]">
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

  const getAllCategories = useGetAllCategories();
  const getAllBrandNames = useGetAllBrandNames();
  const getAllAttributes = useGetAllAttributes();
  const getAllProducts = useGetAllProducts();

  const { currentUser } = useGetCurrentUser();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { data: productResponse, isLoading: isFetching } = useGetProductById(id ?? 0, isEdit);

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
      price: 0,
      cost: undefined,
      stock: 0,
      lowStockThreshold: undefined,
      displayOrder: 0,
      images: [],
      status: '',
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
      reset({
        name: p.name,
        slug: p.slug,
        description: p.description ?? '',
        price: p.price,
        cost: p.cost ?? undefined,
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold ?? undefined,
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
      toast({ variant: 'success', title: `Product ${isEdit ? 'updated' : 'created'} successfully` });
      router.push('/admin/products');
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
      <form autoComplete="off" onSubmit={handleSubmit(submitData)} className="space-y-8">
        {/* Basic details */}
        <Section icon={Info} title="Basic details" description="The product name, URL slug and a short description.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          </div>
        </Section>

        <Separator />

        {/* Organization */}
        <Section icon={Layers} title="Organization" description="Classify the product and control where it appears.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        </Section>

        <Separator />

        {/* Pricing & inventory */}
        <Section icon={Boxes} title="Pricing & inventory" description="Set the selling price, cost and how many units are in stock.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selling price *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(+e.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase cost</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(numberChange(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock</FormLabel>
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

            <FormField
              control={form.control}
              name="lowStockThreshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Low stock alert</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 5"
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
        </Section>

        <Separator />

        {/* Media */}
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
        </Section>

        {/* Actions */}
        <div className="sticky bottom-0 -mx-3 flex items-center justify-end gap-2 border-t border-border bg-background/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:-mx-5 md:px-5">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            {isEdit ? 'Update' : 'Create'} Product
          </Button>
        </div>
      </form>
    </Form>
  );
}
