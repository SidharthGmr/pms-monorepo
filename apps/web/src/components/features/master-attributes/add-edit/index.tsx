'use client';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { StatusValues } from '@/enums/status-values.enum';
import { useCreateMasterAttribute, useGetMasterAttributeById, useUpdateMasterAttribute } from '@/hooks/service-hooks/useMasterEntryService';
import { CreateMasterAttributeModel } from '@/models/master-entry.model';
import { MasterAttributeSchema } from '@/schema/masterEntrySchema';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

interface ManageMasterAttributeProps {
  id?: number;
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

export default function ManageMasterAttribute({ id, isOpen, onClose }: ManageMasterAttributeProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;
  const createMutation = useCreateMasterAttribute();
  const updateMutation = useUpdateMasterAttribute();
  const { data: response, isLoading: isFetching } = useGetMasterAttributeById(id ?? 0, isEdit);

  const form = useForm<CreateMasterAttributeModel>({
    resolver: yupResolver(MasterAttributeSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      unit: '',
      status: StatusValues.Published,
      displayOrder: 0,
    },
  });

  useEffect(() => {
    if (isEdit && response?.data?.data) {
      const attribute = response.data.data;
      form.reset({
        name: attribute.name,
        code: attribute.code,
        description: attribute.description ?? '',
        unit: attribute.unit ?? '',
        status: attribute.status as string,
        displayOrder: attribute.displayOrder ?? 0,
      });
    }
  }, [isEdit, response, form]);

  const submitData = async (model: CreateMasterAttributeModel) => {
    const result = isEdit ? await updateMutation.mutateAsync({ id: id!, model }) : await createMutation.mutateAsync(model);

    if (result && (result.status === 200 || result.status === 201)) {
      toast({ variant: 'success', title: `Attribute ${isEdit ? 'updated' : 'created'} successfully` });
      onClose(true);
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(result);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isFetching;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose(false)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit' : 'Add'} Master Attribute</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form autoComplete="off" onSubmit={form.handleSubmit(submitData)} className="space-y-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Size, Color, Weight" {...field} value={field.value ?? ''} />
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
                  <FormLabel>Code *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. SIZE"
                      className="font-mono uppercase"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormDescription>
                    The stable key other screens select by, e.g. &lt;MasterEntrySelect attributeCode=&quot;SIZE&quot; /&gt;. Renaming the label is
                    safe; changing the code is not.
                  </FormDescription>
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
                    <Textarea className="resize-none" rows={2} placeholder="What this attribute is for" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="kg, cm" {...field} value={field.value ?? ''} />
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
                        placeholder="1, 2, 3"
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
                          placeholder="Select Status"
                          buttonClass="w-full"
                          disableSearch
                          items={[
                            { label: 'Published', value: StatusValues.Published },
                            { label: 'Draft', value: StatusValues.Draft },
                          ]}
                          value={field.value}
                          valueType="string"
                          containerName="master-attribute-form-status"
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
                {isEdit ? 'Update' : 'Add'} Attribute
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
