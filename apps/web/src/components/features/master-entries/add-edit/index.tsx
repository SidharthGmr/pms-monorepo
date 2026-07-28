'use client';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { StatusValues } from '@/enums/status-values.enum';
import {
  useCreateMasterEntry,
  useGetAllMasterAttributes,
  useGetMasterEntryById,
  useUpdateMasterEntry,
} from '@/hooks/service-hooks/useMasterEntryService';
import { CreateMasterEntryModel } from '@/models/master-entry.model';
import { MasterEntrySchema } from '@/schema/masterEntrySchema';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

interface ManageMasterEntryProps {
  id?: number;
  /** Pre-selects the group when adding from a filtered list. */
  defaultAttributeId?: number;
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

export default function ManageMasterEntry({ id, defaultAttributeId, isOpen, onClose }: ManageMasterEntryProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;
  const createMutation = useCreateMasterEntry();
  const updateMutation = useUpdateMasterEntry();
  const { data: response, isLoading: isFetching } = useGetMasterEntryById(id ?? 0, isEdit);
  const { data: attributesResponse } = useGetAllMasterAttributes({ showAllRecords: true, status: StatusValues.Published });

  const attributes = useMemo(() => attributesResponse?.data?.data?.data ?? [], [attributesResponse]);
  const attributeItems = useMemo(() => attributes.map((attribute) => ({ label: attribute.name, value: attribute.id })), [attributes]);

  const form = useForm<CreateMasterEntryModel>({
    resolver: yupResolver(MasterEntrySchema),
    defaultValues: {
      attributeId: defaultAttributeId ?? 0,
      name: '',
      value: '',
      colorHex: '',
      status: StatusValues.Published,
      displayOrder: 0,
    },
  });

  useEffect(() => {
    if (isEdit && response?.data?.data) {
      const entry = response.data.data;
      form.reset({
        attributeId: entry.attributeId,
        name: entry.name,
        value: entry.value,
        colorHex: entry.colorHex ?? '',
        status: entry.status as string,
        displayOrder: entry.displayOrder ?? 0,
      });
    }
  }, [isEdit, response, form]);

  const selectedAttribute = attributes.find((attribute) => attribute.id === form.watch('attributeId'));

  const submitData = async (model: CreateMasterEntryModel) => {
    // An empty colour field must clear the column, not send "".
    const payload: CreateMasterEntryModel = { ...model, colorHex: model.colorHex || null };
    const result = isEdit ? await updateMutation.mutateAsync({ id: id!, model: payload }) : await createMutation.mutateAsync(payload);

    if (result && (result.status === 200 || result.status === 201)) {
      toast({ variant: 'success', title: `Value ${isEdit ? 'updated' : 'created'} successfully` });
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
          <DialogTitle>{isEdit ? 'Edit' : 'Add'} Master Entry</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form autoComplete="off" onSubmit={form.handleSubmit(submitData)} className="space-y-3">
            <FormField
              control={form.control}
              name="attributeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attribute *</FormLabel>
                  <FormControl>
                    <div className="flex">
                      <SelectSearch
                        placeholder="Select attribute"
                        buttonClass="w-full"
                        items={attributeItems}
                        value={field.value || undefined}
                        valueType="number"
                        containerName="master-entry-form-attribute"
                        onChange={(value) => field.onChange(+value)}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Large" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormDescription>Shown in dropdowns.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stored Value *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. L" className="font-mono" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormDescription>
                      Saved on records{selectedAttribute?.unit ? ` (unit: ${selectedAttribute.unit})` : ''}. Unique within the attribute.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="colorHex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Colour</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input placeholder="#FF0000" className="font-mono" {...field} value={field.value ?? ''} />
                        {field.value && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(field.value) && (
                          <span className="h-8 w-8 shrink-0 rounded border" style={{ backgroundColor: field.value }} />
                        )}
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
                          containerName="master-entry-form-status"
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
                {isEdit ? 'Update' : 'Add'} Value
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
