'use client';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { StatusValues } from '@/enums/status-values.enum';
import { useCreateSupplier, useGetSupplierById, useUpdateSupplier } from '@/hooks/service-hooks/useSupplierService';
import { CreateSupplierModel } from '@/models/supplier.model';
import SupplierSchema from '@/schema/supplierSchema';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

interface ManageSupplierProps {
  id?: number;
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

export default function ManageSupplier({ id, isOpen, onClose }: ManageSupplierProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;

  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const { data: supplierResponse, isLoading: isFetching } = useGetSupplierById(id ?? 0, isEdit);

  const form = useForm<CreateSupplierModel>({
    resolver: yupResolver(SupplierSchema),
    defaultValues: {
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
      status: StatusValues.Draft,
      displayOrder: 1,
    },
  });

  useEffect(() => {
    if (isEdit && supplierResponse?.data?.data) {
      const s = supplierResponse.data.data;
      form.reset({
        name: s.name,
        contactPerson: s.contactPerson ?? '',
        email: s.email ?? '',
        phone: s.phone ?? '',
        address: s.address ?? '',
        notes: s.notes ?? '',
        status: s.status,
        displayOrder: s.displayOrder ?? 0,
      });
    }
  }, [isEdit, supplierResponse, form]);

  const submitData = async (model: CreateSupplierModel) => {
    const response = isEdit ? await updateMutation.mutateAsync({ id: id!, model }) : await createMutation.mutateAsync(model);

    if (response && (response.status === 200 || response.status === 201)) {
      toast({ variant: 'success', title: `Supplier ${isEdit ? 'updated' : 'created'} successfully` });
      onClose(true);
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isFetching;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose(false)}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit' : 'Add'} Supplier</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form autoComplete="off" onSubmit={form.handleSubmit(submitData)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Acme Corp" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Jane Doe" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. +1 555 123 4567" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g. jane@acme.com" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea className="resize-none" rows={2} placeholder="Street, city, state, ZIP" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea className="resize-none" rows={2} placeholder="Any additional details..." {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          containerName="supplier-status"
                          onChange={(value) => field.onChange(value)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onClose(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={isLoading}>
                {isEdit ? 'Update' : 'Add'} Supplier
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
