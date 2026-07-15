'use client';
import { SelectSearch } from '@/components/common/select-search'; 
import { ProductImageUploader } from '@/components/common/admin-media/product-image-uploader';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

interface ManageProductProps {
  id: number;
}

export default function ManageProduct({ id }: ManageProductProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
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
    resolver: zodResolver(productFields),
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

    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  };

  const isLoading = createProduct.isPending || updateProduct.isPending || isFetching;

  return (


    <Form {...form}>
      <form autoComplete="off" onSubmit={handleSubmit(submitData)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="parentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Product Parent*</FormLabel>
                <FormControl>
                  <SelectSearch
                    buttonClass={`w-full`}
                    placeholder="Select Parent Product"
                    disableSearch={true}
                    items={
                      getAllProducts?.data?.data?.data?.data?.map((item) => ({
                        value: item.id,
                        label: item.name,
                      })) ?? []
                    }
                    value={field.value ?? ''}
                    onChange={(value) => field.onChange(value ? Number(value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Name */}
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Category*</FormLabel>
                <FormControl>
                  <SelectSearch
                    buttonClass={`w-full`}
                    placeholder="Select Category"
                    disableSearch={true}
                    items={
                      getAllCategories?.data?.data?.data?.data?.map((item) => ({
                        value: item.id,
                        label: item.name,
                      })) ?? []
                    }
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
                <FormLabel>Select Brand*</FormLabel>
                <FormControl>
                  <SelectSearch
                    buttonClass="w-full"
                    placeholder="Select Brand"
                    disableSearch={false}
                    items={
                      getAllBrandNames?.data?.data?.data?.data?.map((item) => ({
                        value: item.id,
                        label: item.name, // ← was item.name
                      })) ?? []
                    }
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
                <FormLabel>Select Attribute*</FormLabel>
                <FormControl>
                  <SelectSearch
                    buttonClass="w-full"
                    placeholder="Select Attribute"
                    disableSearch={false}
                    items={
                      (getAllAttributes?.data?.data?.data?.data ?? []).map((item) => ({
                        value: item.id,
                        label: item.name, // ← was item.name
                      }))
                    }
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

          {/* Slug */}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Price */}
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selling Price *</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Enter Your Price" {...field} onChange={(e) => field.onChange(+e.target.value)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Cost */}
          <FormField
            control={form.control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchased Cost*</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Enter Purchased Price"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Stock */}
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="0"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Low Stock Threshold */}
          <FormField
            control={form.control}
            name="lowStockThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Low Stock Threshold</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="e.g. 5"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <textarea
                    rows={3}
                    placeholder="Product description..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
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
            name="images"
            render={({ field }) => (
              <FormItem className="my-4">
                <FormLabel>Product Images</FormLabel>
                <FormControl>
                  <ProductImageUploader 
                    value={field.value || []} 
                    onChange={field.onChange} 
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
                  <div className="flex">
                    <SelectSearch
                      placeholder="Select Status*"
                      buttonClass="w-full"
                      disableSearch={true}
                      items={[
                        { label: 'Published', value: StatusValues.Published },
                        { label: 'Draft', value: StatusValues.Draft },
                      ]}
                      value={field.value}
                      valueType="string"
                      containerName="attribute-status"
                      onChange={(value) => {
                        field.onChange(value);
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="md:col-span-2 flex justify-end gap-2 pt-2">
          {/* <Button type="button" variant="outline">
            Cancel
          </Button> */}
          <Button type="submit" loading={isLoading}>
            {isEdit ? 'Update' : 'Create'} Product
          </Button>
        </div>
      </form>
    </Form>

  );
}
