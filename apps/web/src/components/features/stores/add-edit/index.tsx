'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zod-resolver';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';

import { storeFields } from '@pms/types';
import { useCreateStore, useGetStoreById, useUpdateStore, useUploadStoreLogo } from '@/hooks/service-hooks/useStoreService';
import { SelectSearch } from '@/components/common/select-search';

import { Checkbox } from '@/components/ui/checkbox';
import { CreateStoreModel, StatusValues } from '@pms/types';
import { FileUpload } from '@/components/common/file-upload';

interface ManageStoreProps {
  id?: number;
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

interface StoreFormProps {
  id?: number;
  onClose: (refresh: boolean) => void;
}

/** The full store form - super admin only; admins edit their own store from Settings. */
export function StoreForm({ id, onClose }: StoreFormProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;

  const createMutation = useCreateStore();
  const updateMutation = useUpdateStore();
  const uploadLogo = useUploadStoreLogo();
  const { data: storeResponse, isLoading: isFetching } = useGetStoreById(id ?? 0, isEdit);

  // The logo goes through its own public branding route, not the default private blob store.
  const uploadStoreLogo = async (file: File) => (await uploadLogo.mutateAsync({ file })).url;

  const form = useForm<CreateStoreModel>({
    resolver: zodResolver(storeFields),
    defaultValues: {
      name: '',
      code: '',
      phone: '',
      email: '',
      siteName: '',
      storeLogo: '',
      isActive: true,
      status: StatusValues.Published,
    },
  });

  useEffect(() => {
    if (isEdit && storeResponse?.data?.data) {
      const store = storeResponse.data.data;
      form.reset({
        name: store.name,
        code: store.code,
        phone: store.phone ?? '',
        email: store.email ?? '',
        siteName: store.siteName ?? '',
        storeLogo: store.storeLogo ?? '',
        isActive: store.isActive,
        status: store.status,
      });
    }
  }, [isEdit, storeResponse, form]);

  const submitData = async (model: CreateStoreModel) => {
    // A store's code is written once at creation and can never change - the update
    // payload (UpdateStoreModel) doesn't carry it.
    const { code: _code, ...updatable } = model;
    const response = isEdit ? await updateMutation.mutateAsync({ id: id!, model: updatable }) : await createMutation.mutateAsync(model);

    if (response && (response.status === 200 || response.status === 201)) {
      toast({ variant: 'success', title: `Store ${isEdit ? 'updated' : 'created'} successfully` });
      onClose(true);
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isFetching;

  return (
    <Form {...form}>
      <form autoComplete="off" onSubmit={form.handleSubmit(submitData)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Store Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Main Branch" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Store Code *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. STORE001" disabled={isEdit} {...field} />
                </FormControl>
                {isEdit ? <p className="text-xs text-muted-foreground">The store code is permanent and cannot be changed.</p> : <FormMessage />}
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. +1234567890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="e.g. store@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="siteName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Site Name</FormLabel>
                <FormControl>
                  <Input placeholder="Brand name on invoices & emails" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="storeLogo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Store Logo</FormLabel>
                <FormControl>
                  <FileUpload
                    value={field.value ?? ''}
                    onChange={(url) => form.setValue('storeLogo', url, { shouldDirty: true })}
                    label="store logo"
                    hint="PNG, JPG, WEBP or SVG · up to 2MB"
                    maxSizeMb={2}
                    uploadOverride={uploadStoreLogo}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
                      containerName="store-status"
                      onChange={(value) => field.onChange(value)}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-7">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Is Active</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onClose(false)}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            {isEdit ? 'Update' : 'Add'} Store
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function ManageStore({ id, isOpen, onClose }: ManageStoreProps) {
  const isEdit = !!id && id > 0;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose(false)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit' : 'Add'} Store</DialogTitle>
        </DialogHeader>

        {/* Mounted only while open so the form state resets between stores. */}
        {isOpen && <StoreForm id={id} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
