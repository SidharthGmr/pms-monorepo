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
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import StatusData from '@/data/status.data';
import { StatusValues } from '@/enums/status-values.enum';
import { useCreateCategory, useGetAllCategories, useGetCategoryById, useUpdateCategory } from '@/hooks/service-hooks/useCategoryService';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';
import { zodResolver } from '@/lib/zod-resolver';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { CategoryModel, CategoryResponseDto, categoryFields } from '@pms/types';
import { useEffect, useReducer, useState } from 'react';
import { useForm } from 'react-hook-form';
import { InModalActionType, InModalState, modalReducer } from '@/reducers/InModalAction';

const initialState: InModalState = {
  modalHeading: 'Add Grade',
  isUpdate: false,
  refreshRequired: false,
  showLoader: false,
};

interface ManageCategoryProps {
  id?: number;
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

export default function ManageCategory({ id, isOpen, onClose }: ManageCategoryProps) {
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState<boolean>(false);
  const [states, dispatch] = useReducer(modalReducer, initialState);

  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;

  const getAllCategories = useGetAllCategories({ showAllRecords: true });
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const getCategoryResponse = useGetCategoryById(id ?? 0, isEdit);

  const form = useForm<CategoryModel>({
    resolver: zodResolver(categoryFields),
    defaultValues: {
      name: '',
      description: '',
      images: [],
      parentId: null,
      status: StatusValues.Published,
      displayOrder: undefined,
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isDirty },
  } = form;

  useUnsavedChangesWarning(isDirty);

  const fillCategoryDetails = (data: CategoryResponseDto) => {
    const values: CategoryModel = {
      name: data.name,
      description: data.description ?? '',
      images: data.images ?? [],
      parentId: data.parentId ?? null,
      status: data.status,
      displayOrder: data.displayOrder ?? undefined,
    };
    reset(values);
  };

  useEffect(() => {
    if (getCategoryResponse.status === 'success' && getCategoryResponse.data?.data.data) {
      dispatch({
        type: InModalActionType.IS_UPDATE,
        payload: true,
      });
      setIsUpdating(true);
      fillCategoryDetails(getCategoryResponse.data.data.data);
    }
  }, [getCategoryResponse.status, getCategoryResponse.data?.data?.data]);

  // The API rejects self-parenting, so don't offer the category being edited as its own parent.
  const parentOptions =
    getAllCategories?.data?.data?.data?.data?.filter((item) => !isEdit || item.id !== id).map((item) => ({ value: item.id, label: item.name })) ?? [];

  const submitData = async (model: CategoryModel) => {
    const response = isEdit ? await updateCategory.mutateAsync({ id: id!, model }) : await createCategory.mutateAsync(model);

    if (response && (response.status === 200 || response.status === 201) && response.data.data) {
      toast({
        variant: 'success',
        title: `Category ${isUpdating ? 'updated' : 'created'} successfully`,
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

  const isSaving = createCategory.isPending || updateCategory.isPending;

  const handleCancel = () => {
    if (isDirty) {
      setShowLeaveConfirm(true);
      return;
    }
    onClose(false);
  };

  if (isEdit && getCategoryResponse.isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={() => onClose(false)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4" aria-busy="true" aria-label="Loading category">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isEdit && getCategoryResponse.isError) {
    return (
      <Dialog open={isOpen} onOpenChange={() => onClose(false)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <Card>
            <CardTitle variant="sm">Could not load this category</CardTitle>
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
            <DialogTitle>{isEdit ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form autoComplete="off" onSubmit={handleSubmit(submitData)} className="space-y-4">
              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Category</FormLabel>
                    <FormControl>
                      <SelectSearch
                        buttonClass="w-full"
                        placeholder="Select Parent Category"
                        items={parentOptions}
                        value={field.value ?? ''}
                        containerName="category-parent"
                        onChange={(value) => field.onChange(value ? Number(value) : null)}
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
                      <Input placeholder="Category name" {...field} />
                    </FormControl>
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
                      <Textarea rows={3} className="resize-none" placeholder="Description..." {...field} value={field.value ?? ''} />
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
                    <FormLabel>Category image</FormLabel>
                    <FormControl>
                      <ProductImageUploader value={field.value || []} onChange={field.onChange} />
                    </FormControl>
                    <CardDescription className="text-xs text-muted-foreground">
                      Optional. Shown on the storefront category tile; the first image is used.
                    </CardDescription>
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
                  {isEdit ? 'Update' : 'Create'} Category
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
        bodyText="This category has unsaved changes. Closing now will lose them."
        noButtonText="Keep editing"
        yesButtonText="Discard"
      />
    </>
  );
}
