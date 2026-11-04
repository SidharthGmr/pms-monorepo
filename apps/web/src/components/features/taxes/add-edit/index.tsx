'use client';
import ConfirmBox from '@/components/common/confirm-box';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import ManageTaxSkeleton from '@/components/skelton/manageTax-Skeleton';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { TaxCategoryData } from '@/data/tax.data';
import { useCreateTax, useGetTaxById, useUpdateTax } from '@/hooks/service-hooks/useTaxService';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';
import { zodResolver } from '@/lib/zod-resolver';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { taxFields, TaxCategory, TaxCategoryEnum, TaxModel } from '@pms/types';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

interface ManageTaxProps {
  /** Absent when adding - the listing wrapper opens this dialog with no id. */
  id?: string;
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

export default function ManageTax({ id, isOpen, onClose }: ManageTaxProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id;

  const [showLeaveConfirm, setShowLeaveConfirm] = useState<boolean>(false);

  const createMutation = useCreateTax();
  const updateMutation = useUpdateTax();
  const getResponse = useGetTaxById(id ?? '', isEdit);

  const form = useForm<TaxModel>({
    resolver: zodResolver(taxFields),
    defaultValues: {
      name: '',
      code: '',
      rate: undefined,
      category: TaxCategoryEnum.Taxable,
      isActive: true,
      isDefault: false,
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isDirty },
  } = form;

  useUnsavedChangesWarning(isDirty);

  useEffect(() => {
    const row = getResponse.data?.data?.data;
    if (isEdit && row) {
      reset({
        name: row.name,
        code: row.code,
        rate: row.rate,
        category: row.category,
        isActive: row.isActive,
        isDefault: row.isDefault,
      });
    }
  }, [isEdit, getResponse.data?.data?.data, reset]);

  const submitData = async (model: TaxModel) => {
    const response = isEdit ? await updateMutation.mutateAsync({ id: id!, model }) : await createMutation.mutateAsync(model);

    if (response && (response.status === 200 || response.status === 201)) {
      toast({ variant: 'success', title: `Tax ${isEdit ? 'updated' : 'created'} successfully` });
      onClose(true);
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleCancel = () => {
    if (isDirty) {
      setShowLeaveConfirm(true);
      return;
    }
    onClose(false);
  };

  if (isEdit && getResponse.isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={() => onClose(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Tax</DialogTitle>
          </DialogHeader>
          <ManageTaxSkeleton />
        </DialogContent>
      </Dialog>
    );
  }

  if (isEdit && getResponse.isError) {
    return (
      <Dialog open={isOpen} onOpenChange={() => onClose(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Tax</DialogTitle>
          </DialogHeader>
          <Card>
            <CardTitle variant="sm">Could not load this tax</CardTitle>
            <CardDescription>Close this dialog and try again.</CardDescription>
          </Card>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit' : 'Add'} Tax</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form autoComplete="off" onSubmit={handleSubmit(submitData)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. GST 18%" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. GST18" className="font-mono uppercase" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate (%) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="18.00"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <SelectSearch
                        buttonClass="w-full"
                        placeholder="Select Category"
                        containerName="tax-category"
                        disableSearch
                        items={TaxCategoryData}
                        value={field.value ?? ''}
                        onChange={(value) => field.onChange(value as TaxCategory)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-lg border">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4 space-y-0 p-3">
                      <FormLabel className="font-medium">Active</FormLabel>
                      <FormControl>
                        <Switch checked={field.value ?? false} aria-label="Active" onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4 space-y-0 border-t p-3">
                      <div>
                        <FormLabel className="font-medium">Default tax</FormLabel>
                        <p className="text-xs text-muted-foreground">Only one tax can be the default; saving this one replaces it.</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value ?? false} aria-label="Default tax" onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSaving}>
                  {isEdit ? 'Update' : 'Add'} Tax
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmBox
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onSubmit={() => {
          setShowLeaveConfirm(false);
          onClose(false);
        }}
        heading="Discard changes?"
        bodyText="This form has unsaved changes. Closing now will lose them."
        noButtonText="Keep editing"
        yesButtonText="Discard"
      />
    </>
  );
}
