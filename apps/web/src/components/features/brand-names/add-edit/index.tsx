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
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { zodResolver } from '@/lib/zod-resolver';
import { useEffect, useReducer, useState } from 'react';
import { useForm } from 'react-hook-form';
import { BrandNameDto, brandNameFields, CreateBrandNameModel } from '@pms/types';
import { AxiosResponse } from 'axios';
import Response from '@/dtos/Response';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';
import StatusData from '@/data/status.data';
import { InModalActionType, InModalState, modalReducer } from '@/reducers/InModalAction';

const initialState: InModalState = {
  modalHeading: 'Add Grade',
  isUpdate: false,
  refreshRequired: false,
  showLoader: false,
};

interface ManageBrandNameProps {
  /** Absent when adding - the listing wrapper opens this dialog with no id. */
  id?: number;
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

export default function ManageBrandName({ id, isOpen, onClose }: ManageBrandNameProps) {
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState<boolean>(false);
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const [states, dispatch] = useReducer(modalReducer, initialState);

  const isEdit = !!id && id > 0;

  const createMutation = useCreateBrandName();
  const updateMutation = useUpdateBrandName();
  const getbrandNameResponse = useGetBrandNameById(id ?? 0, isEdit);

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
    setValue,
    handleSubmit,
    watch,
    reset,
    formState: { isDirty },
  } = form;

  useUnsavedChangesWarning(isDirty && !showLoader);

  const fillBrandDetails = (data: BrandNameDto) => {
    const values: CreateBrandNameModel = {
      name: data.name,
      images: data.images ?? [],
      status: data.status,
      displayOrder: data.displayOrder ?? null,
    };
    reset(values);
  };

  useEffect(() => {
    if (getbrandNameResponse.status === 'success' && getbrandNameResponse.data?.data.data) {
      dispatch({
        type: InModalActionType.IS_UPDATE,
        payload: true,
      });
      setIsUpdating(true);
      fillBrandDetails(getbrandNameResponse.data.data.data);
    }
  }, [getbrandNameResponse.status, getbrandNameResponse.data?.data?.data]);

  const submitData = async (model: CreateBrandNameModel) => {
    dispatch({
      type: InModalActionType.SHOW_LOADER,
      payload: true,
    });

    if (showLoader) return; // guard against a double submit

    let response: AxiosResponse<Response<BrandNameDto>>;
    setShowLoader(true);
    if (isUpdating) {
      response = await updateMutation.mutateAsync({ id: id!, model: model });
    } else {
      response = await createMutation.mutateAsync(model);
    }

    dispatch({
      type: InModalActionType.SHOW_LOADER,
      payload: false,
    });

    if (response && (response.status === 200 || response.status === 201) && response.data.data) {
      toast({
        variant: 'success',
        title: isUpdating ? 'Brand updated' : 'Brand created',
        description: `"${response.data.data.name}" has been saved.`,
      });
      reset(model);
      dispatch({
        type: InModalActionType.IS_REFRESH_REQUIRED,
        payload: true,
      });

      onClose(true);
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleCancel = () => {
    if (isDirty) {
      setShowLeaveConfirm(true);
      return;
    }
    onClose(true);
    // router.push('/admin/course/');
  };

  if (isEdit && isLoading && getbrandNameResponse.isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading course">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <Skeleton className="mb-4 h-5 w-40" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (isEdit && getbrandNameResponse.isError) {
    return (
      <Card>
        <CardTitle variant="sm">Could not load this course</CardTitle>
        <CardDescription>Refresh the page to try again, or go back to the course list.</CardDescription>
      </Card>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose(states.refreshRequired)}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
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
                    {/* Text input on purpose: the field holds whatever was typed and the
                        shared schema coerces it to a number (or null) on submit. */}
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
