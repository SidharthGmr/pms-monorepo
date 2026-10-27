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
import { cn } from '@/lib/utils';
import { zodResolver } from '@/lib/zod-resolver';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import StatusSwitch from '@/components/common/status-switch';
import { AxiosResponse } from 'axios';
import { useRouter } from 'next/navigation';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';

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

  const savedRef = useRef(false);
  const nameRef = useRef<HTMLInputElement | null>(null);

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
    setValue('status', data.status || '');
    setValue('displayOrder', data.displayOrder ?? null);
    if ((data.images?.length ?? 0) > 0 || data.displayOrder != null) setOptionalOpen(true);
  };

  useEffect(() => {
    if (getBrandNameResponse.status === 'success' && getBrandNameResponse.data?.data.data) {
      fillBrandDetails(getBrandNameResponse.data.data.data);
    }
  }, [getBrandNameResponse.status, getBrandNameResponse.data?.data?.data]);

  const isSaving = createMutate.isPending || updateMutate.isPending;
  const isError = createMutate.isError || updateMutate.isError;

  useUnsavedChangesWarning(isDirty && !isSaving);

  const save = async (model: CreateBrandNameModel) => {
    let response: AxiosResponse<CustomResponse<BrandNameDto>>;

    if (isEdit) {
      response = await updateMutate.mutateAsync({ id: id, model });
    } else {
      response = await createMutate.mutateAsync(model);
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
    onClose(savedRef.current);
  };

  const showSkeleton = isEdit && getBrandNameResponse.isLoading;
  const fetchFailed = getBrandNameResponse.isError;

  if (showSkeleton) {
    return (
      <Card>
        <div className="grid grid-cols-1 gap-6 px-5 py-5 lg:grid-cols-[1fr_minmax(280px,360px)]" aria-busy="true" aria-label="Loading brand">
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </Card>
    );
  }

  if (isError || fetchFailed) {
    return (
      <Card>
        <CardTitle variant="sm">Could not load this brand</CardTitle>
        <CardDescription>It may have been deleted. Close and refresh the list.</CardDescription>
      </Card>
    );
  }

  // Ctrl/Cmd+Enter saves from anywhere in the form, so a keyboard user never has to reach the footer.

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose(false)}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        {editing ? (
          <>
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
                <form autoComplete="off" onSubmit={onSubmit} onKeyDown={submitOnCtrlEnter(onSubmit)} className={cn('p-5 flex flex-col space-y-4')}>
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
                  onClose(savedRef.current);
                }}
                heading="Discard changes?"
                bodyText="This brand has unsaved changes. Closing now will lose them."
                noButtonText="Keep editing"
                yesButtonText="Discard"
              />
            </>
          </>
        ) : (
          <BrandNameView id={id ?? 0} onEdit={() => setEditing(true)} onClose={() => onClose(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
