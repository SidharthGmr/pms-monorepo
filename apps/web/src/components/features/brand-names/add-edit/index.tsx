'use client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import BrandNameView from './view';
import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { BrandNameDto, brandNameFields, CreateBrandNameModel, CustomResponse, StatusValues } from '@pms/types';
import { SingleImageUpload } from '@/components/common/admin-media/single-image-upload';
import CharCounter from '@/components/common/char-counter';
import { DirtyNote } from '@/components/common/field';
import ConfirmBox from '@/components/common/confirm-box';
import OptionalSection from '@/components/common/optional-section';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';

import { useCreateBrandName, useGetBrandNameById, useUpdateBrandName } from '@/hooks/service-hooks/useBrandNameService';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';
import { submitOnCtrlEnter } from '@/lib/form-shortcuts';
import { zodResolver } from '@/lib/zod-resolver';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import StatusSwitch from '@/components/common/status-switch';
import { AxiosResponse } from 'axios';
import { useRouter } from 'next/navigation';

interface ManageBrandNameProps {
  id?: number;
  isOpen: boolean;
  mode?: 'view' | 'edit';
  onClose: (refresh: boolean) => void;
}

export default function ManageBrandName({ id, isOpen, mode = 'edit', onClose }: ManageBrandNameProps) {
  const router = useRouter();
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [optionalOpen, setOptionalOpen] = useState(false);

  const [editing, setEditing] = useState(mode === 'edit');
  const isEdit = !!id && id > 0;

  const createMutate = useCreateBrandName();
  const updateMutate = useUpdateBrandName();
  const getBrandNameResponse = useGetBrandNameById(id ?? 0, isEdit);

  const nameRef = useRef<HTMLInputElement | null>(null);
  // Guards the form against background refetches: fill once per mount, or a window-focus
  // refetch would overwrite whatever the user has typed since the dialog opened.
  const filledRef = useRef(false);

  const form = useForm<CreateBrandNameModel>({
    resolver: zodResolver(brandNameFields),
    defaultValues: {
      name: '',
      images: [],
      status: StatusValues.Published,
      displayOrder: null,
    },
  });

  const {
    setValue,
    reset,
    formState: { isDirty },
  } = form;

  const name = form.watch('name') ?? '';

  const fillBrandDetails = (data: BrandNameDto) => {
    setValue('name', data.name || '');
    setValue('images', data.images ?? []);
    setValue('status', data.status || StatusValues.Draft);
    setValue('displayOrder', data.displayOrder ?? null);
    if ((data.images?.length ?? 0) > 0 || data.displayOrder != null) setOptionalOpen(true);
  };

  useEffect(() => {
    if (!filledRef.current && getBrandNameResponse.status === 'success' && getBrandNameResponse.data?.data.data) {
      filledRef.current = true;
      fillBrandDetails(getBrandNameResponse.data.data.data);
    }
  }, [getBrandNameResponse.status, getBrandNameResponse.data?.data?.data]);

  const isSaving = createMutate.isPending || updateMutate.isPending;

  useUnsavedChangesWarning(isDirty && !isSaving);

  const save = async (model: CreateBrandNameModel) => {
    // HttpService only resolves statuses below 500; a 5xx or network failure throws. Catch it
    // here so a failed save shows a toast and keeps the form instead of unmounting it.
    let response: AxiosResponse<CustomResponse<BrandNameDto>>;
    try {
      response = isEdit ? await updateMutate.mutateAsync({ id: id, model }) : await createMutate.mutateAsync(model);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: <span>Could not reach the server. Please try again.</span> });
      return;
    }

    if (response && (response.status === 201 || response.status === 200) && response.data.data) {
      toast({
        variant: 'success',
        title: `"${response.data.data.name}" ${isEdit ? 'updated' : 'created'}`,
      });
      router.refresh();
      reset(model);
      onClose(true);
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: <span>{error}</span>,
      });
    }
  };

  const onSubmit = form.handleSubmit(save, (errors) => {
    if (errors.images || errors.displayOrder) setOptionalOpen(true);
  });

  const handleCancel = () => {
    if (isDirty && !isSaving) {
      setShowLeaveConfirm(true);
      return;
    }
    onClose(false);
  };

  const showSkeleton = isEdit && getBrandNameResponse.isLoading;
  const fetchFailed = getBrandNameResponse.isError;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        {showSkeleton ? (
          <div className="space-y-4 p-5" aria-busy="true" aria-label="Loading brand">
            <DialogTitle className="sr-only">Loading brand</DialogTitle>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-10 w-40" />
          </div>
        ) : fetchFailed ? (
          <div className="space-y-2 p-6">
            <DialogTitle className="text-base">Could not load this brand</DialogTitle>
            <DialogDescription>It may have been deleted. Close and refresh the list.</DialogDescription>
          </div>
        ) : editing ? (
          <>
              <DialogHeader className="space-y-0 border-b bg-muted/30 px-6 py-4 text-left">
                <div className="flex items-center gap-3 pr-8">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="truncate text-base">{isEdit ? 'Edit brand' : 'New brand'}</DialogTitle>
                    <DialogDescription className="mt-1 text-xs">
                      <kbd className="rounded border bg-background px-1 font-mono text-[10px]">Ctrl</kbd> +{' '}
                      <kbd className="rounded border bg-background px-1 font-mono text-[10px]">Enter</kbd> saves.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <Form {...form}>
                <form autoComplete="off" onSubmit={onSubmit} onKeyDown={submitOnCtrlEnter(onSubmit)} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Brand name *</FormLabel>
                          <CharCounter schema={brandNameFields} field="name" value={name} />
                        </div>
                        <FormControl>
                          <Input
                            placeholder="e.g. Nike, Adidas"
                            autoFocus
                            {...field}
                            ref={(el) => {
                              field.ref(el);
                              nameRef.current = el;
                            }}
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
                          <StatusSwitch value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <OptionalSection title="Logo & display order" open={optionalOpen} onOpenChange={setOptionalOpen}>
                    <FormField
                      control={form.control}
                      name="images"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo</FormLabel>
                          <FormControl>
                            <SingleImageUpload
                              value={field.value?.[0] ?? ''}
                              onChange={(path) => field.onChange(path ? [path] : [])}
                              folder="brands"
                              alt="Brand logo"
                            />
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
                          <FormLabel>Display order</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </OptionalSection>

                  <DirtyNote dirty={isDirty} />

                  <div className="flex flex-col-reverse gap-2 sm:flex-row">
                    <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
                      Cancel
                    </Button>
                    <Button type="submit" loading={isSaving}>
                      {isEdit ? 'Save changes' : 'Create brand'}
                    </Button>
                  </div>
                </form>
              </Form>

              <ConfirmBox
                isOpen={showLeaveConfirm}
                onClose={() => setShowLeaveConfirm(false)}
                onSubmit={() => {
                  setShowLeaveConfirm(false);
                  onClose(false);
                }}
                heading="Discard changes?"
                bodyText="This brand has unsaved changes. Closing now will lose them."
                noButtonText="Keep editing"
                yesButtonText="Discard"
              />
          </>
        ) : (
          <BrandNameView id={id ?? 0} onEdit={() => setEditing(true)} onClose={() => onClose(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
