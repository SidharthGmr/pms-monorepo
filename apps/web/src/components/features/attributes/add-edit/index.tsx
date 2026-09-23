'use client';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { StatusValues } from '@/enums/status-values.enum';
import { useCreateAttribute, useGetAttributeById, useUpdateAttribute } from '@/hooks/service-hooks/useAttributeService';
import { zodResolver } from '@/lib/zod-resolver';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { AttributeModel, attributeFields } from '@pms/types';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

interface ManageAttributeProps {
  id?: number;
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

export default function ManageAttribute({ id, isOpen, onClose }: ManageAttributeProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;

  const createMutation = useCreateAttribute();
  const updateMutation = useUpdateAttribute();
  const { data: attrResponse, isLoading: isFetching } = useGetAttributeById(id ?? 0, isEdit);

  const form = useForm<AttributeModel>({
    resolver: zodResolver(attributeFields),
    defaultValues: {
      name: '',
      unit: '',
      status: StatusValues.Draft,
      displayOrder: 0,
    },
  });

  useEffect(() => {
    if (isEdit && attrResponse?.data?.data) {
      const a = attrResponse.data.data;
      form.reset({ name: a.name, unit: a.unit ?? '', status: a.status, displayOrder: a.displayOrder ?? null });
    }
  }, [isEdit, attrResponse, form]);

  const submitData = async (model: AttributeModel) => {
    const payload = { ...model, unit: model.unit || null };
    const response = isEdit ? await updateMutation.mutateAsync({ id: id!, model: payload }) : await createMutation.mutateAsync(payload);

    if (response && (response.status === 200 || response.status === 201)) {
      toast({ variant: 'success', title: `Attribute ${isEdit ? 'updated' : 'created'} successfully` });
      onClose(true);
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isFetching;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Attribute' : 'Add Attribute'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form autoComplete="off" onSubmit={form.handleSubmit(submitData)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Color, Weight, Material" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. kg, cm (optional)" {...field} value={field.value ?? ''} />
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
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="e.g. 1, 2, 3 (optional)"
                        value={field.value ?? ''}
                        // Clearing the box means "no position", not position 0.
                        onChange={(e) => field.onChange(e.target.value === '' ? null : +e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onClose(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={isLoading}>
                {isEdit ? 'Update' : 'Add'} Attribute
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
