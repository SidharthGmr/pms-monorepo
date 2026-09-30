'use client';
import { ProductImageUploader } from '@/components/common/admin-media/product-image-uploader';
import ConfirmBox from '@/components/common/confirm-box';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import StatusData from '@/data/status.data';
import { StatusValues } from '@/enums/status-values.enum';
import { useCreateBrandName, useGetBrandNameById, useUpdateBrandName } from '@/hooks/service-hooks/useBrandNameService';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';
import { zodResolver } from '@/lib/zod-resolver';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { BrandNameDto, brandNameFields, CreateBrandNameModel } from '@pms/types';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

interface ManageBrandNameProps {
  /** Absent when adding - the listing wrapper opens this dialog with no id. */
  id?: number;
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

export default function ManageBrandName({ id, isOpen, onClose }: ManageBrandNameProps) {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState<boolean>(false);
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  const isEdit = !!id && id > 0;

  const createMutation = useCreateBrandName();
  const updateMutation = useUpdateBrandName();
  const getBrandNameResponse = useGetBrandNameById(id ?? 0, isEdit);

  const form = useForm<CreateBrandNameModel>({
    resolver: zodResolver(brandNameFields),
    defaultValues: {
      name: '',
      images: [],
      status: StatusValues.Draft,
      displayOrder: null,
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isDirty },
  } = form;

  const isSaving = createMutation.isPending || updateMutation.isPending;

  useUnsavedChangesWarning(isDirty && !isSaving);

  const fillBrandDetails = (data: BrandNameDto) => {
    reset({
      name: data.name,
      images: data.images ?? [],
      status: data.status,
      displayOrder: data.displayOrder ?? null,
    });
  };

  useEffect(() => {
    if (getBrandNameResponse.status === 'success' && getBrandNameResponse.data?.data.data) {
      fillBrandDetails(getBrandNameResponse.data.data.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getBrandNameResponse.status, getBrandNameResponse.data?.data?.data]);

  // Double submits are blocked by the Save button's `loading` state (mutation pending). The old
  // local `showLoader` flag was set on the first submit and never cleared, so after one failed
  // save - a duplicate name, say - every later click silently did nothing.
  const submitData = async (model: CreateBrandNameModel) => {
    const response = isEdit ? await updateMutation.mutateAsync({ id: id!, model }) : await createMutation.mutateAsync(model);

    if (response && (response.status === 200 || response.status === 201) && response.data.data) {
      toast({
        variant: 'success',
        title: isEdit ? 'Brand updated' : 'Brand created',
        description: `"${response.data.data.name}" has been saved.`,
      });
      reset(model);
      onClose(true);
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowLeaveConfirm(true);
      return;
    }
    onClose(false);
  };

  if (isEdit && getBrandNameResponse.isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={() => onClose(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Brand Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-4" aria-busy="true" aria-label="Loading brand name">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isEdit && getBrandNameResponse.isError) {
    return (
      <Dialog open={isOpen} onOpenChange={() => onClose(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Brand Name</DialogTitle>
          </DialogHeader>
          <Card>
            <CardTitle variant="sm">Could not load this brand name</CardTitle>
            <CardDescription>Close this dialog and try again.</CardDescription>
          </Card>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit' : 'Add'} Brand Name</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form autoComplete="off" onSubmit={handleSubmit(submitData)} className="space-y-4">
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
                    <CardDescription className="text-xs text-muted-foreground">Optional. The first image is used as the logo.</CardDescription>
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
                      <Input {...field} value={field.value ?? ''} placeholder="Enter Display Order" />
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
                    <SelectSearch items={StatusData} value={field.value} onChange={field.onChange} placeholder="Status*" disableSearch />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSaving}>
                  {isEdit ? 'Update' : 'Add'} Brand Name
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
        bodyText="This brand name has unsaved changes. Closing now will lose them."
        noButtonText="Keep editing"
        yesButtonText="Discard"
      />
    </>
  );
}
