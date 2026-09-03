'use client';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProductImageUploader } from '@/components/common/admin-media/product-image-uploader';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { StatusValues } from '@/enums/status-values.enum';
import { useCreateBrandName, useGetBrandNameById, useUpdateBrandName } from '@/hooks/service-hooks/useBrandNameService';
import { CreateBrandNameModel } from '@/models/brand-name.model';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BrandNameValidator } from '@pms/types';

interface ManageBrandNameProps {
  id?: number;
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

export default function ManageBrandName({ id, isOpen, onClose }: ManageBrandNameProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;

  const createMutation = useCreateBrandName();
  const updateMutation = useUpdateBrandName();
  const { data: getbrandNameResponse, isLoading: isFetching } = useGetBrandNameById(id ?? 0, isEdit);

  const form = useForm<CreateBrandNameModel>({
    resolver: zodResolver(BrandNameValidator),
    defaultValues: {
      name: '',
      images: [],
      status: StatusValues.Draft,
      displayOrder: 0,
    },
  });

  useEffect(() => {
    if (isEdit && getbrandNameResponse?.data?.data) {
      const x = getbrandNameResponse?.data?.data;
      form.reset({
        name: x.name,
        images: x.images ?? [],
        status: x.status,
        displayOrder: x.displayOrder ?? 0,
      });
    }
  }, [isEdit, getbrandNameResponse, form]);

  const submitData = async (model: CreateBrandNameModel) => {
    const response = isEdit ? await updateMutation.mutateAsync({ id: id!, model }) : await createMutation.mutateAsync(model);

    if (response && (response.status === 200 || response.status === 201)) {
      toast({ variant: 'success', title: `Brand name ${isEdit ? 'updated' : 'created'} successfully` });
      onClose(true);
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isFetching;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit' : 'Add'} Brand Name</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form autoComplete="off" onSubmit={form.handleSubmit(submitData)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Nike, Adidas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand logo</FormLabel>
                  <FormControl>
                    <ProductImageUploader value={field.value || []} onChange={field.onChange} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Optional. The first image is used as the logo.</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 1, 2, 3 (optional)"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : +e.target.value)}
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
                        containerName="brand-name-status"
                        onChange={(value) => field.onChange(value)}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onClose(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={isLoading}>
                {isEdit ? 'Update' : 'Add'} Brand Name
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
