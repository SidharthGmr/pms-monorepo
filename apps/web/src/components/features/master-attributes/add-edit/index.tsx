'use client';
import { useEffect, useRef, useState } from 'react';
import { submitOnCtrlEnter } from '@/lib/form-shortcuts';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { AlertTriangle, ListChecks, Lock, Unlock } from 'lucide-react';
import ConfirmBox from '@/components/common/confirm-box';
import { DirtyNote } from '@/components/common/field';
import OptionalSection from '@/components/common/optional-section';
import { SelectSearch } from '@/components/common/select-search';
import StatusSwitch from '@/components/common/status-switch';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';

import { useGetAllBrandNames } from '@/hooks/service-hooks/useBrandNameService';
import { useGetAllCategories } from '@/hooks/service-hooks/useCategoryService';
import { useCreateMasterAttribute, useGetMasterAttributeById, useUpdateMasterAttribute } from '@/hooks/service-hooks/useMasterEntryService';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';

import { MasterAttributeSchema } from '@/schema/masterEntrySchema';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { StatusValues, CreateMasterAttributeModel } from '@pms/types';
import { CardDescription } from '@/components/ui/card';

interface ManageMasterAttributeProps {
  id?: number;
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

const DEFAULT_VALUES: CreateMasterAttributeModel = {
  name: '',
  code: '',
  categoryId: undefined,
  brandNameId: undefined,
  status: StatusValues.Published,
  displayOrder: 0,
};

// "Shoe Size (EU)" -> "SHOE_SIZE_EU". Matches the schema's /^[A-Z][A-Z0-9_]*$/ so a generated
// code never fails validation; a name with no usable letters yields '' and the field stays empty.
export function codeFromName(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^[^A-Z]+/, '')
    .replace(/_+$/, '')
    .slice(0, 50);
}

// One dialog for Add and Edit, structured like ManageCategory: no id creates, an id edits.
// Escape and the X go through the dirty check; clicking outside does nothing so a stray click cannot discard edits.
export default function ManageMasterAttribute({ id, isOpen, onClose }: ManageMasterAttributeProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;

  const createMutation = useCreateMasterAttribute();
  const updateMutation = useUpdateMasterAttribute();
  const { data: response, isLoading: isFetching, isError: fetchFailed } = useGetMasterAttributeById(id ?? 0, isEdit);
  const getAllCategories = useGetAllCategories({ showAllRecords: true });
  const getAllBrandNames = useGetAllBrandNames({ showAllRecords: true });

  // Code follows Name until the user types in it; on edit it starts locked because other screens select by it.
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [codeTouched, setCodeTouched] = useState(false);
  const [codeUnlocked, setCodeUnlocked] = useState(!isEdit);

  const form = useForm<CreateMasterAttributeModel>({
    resolver: yupResolver(MasterAttributeSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const {
    formState: { isDirty },
  } = form;

  // Fill once per mount: without the latch a window-focus refetch (new response object) would
  // re-run the effect and overwrite whatever the user has typed since the dialog opened.
  const filledRef = useRef(false);
  useEffect(() => {
    if (!filledRef.current && isEdit && response?.data?.data) {
      filledRef.current = true;
      const attribute = response.data.data;
      form.reset({
        name: attribute.name,
        code: attribute.code,
        categoryId: attribute.categoryId ?? undefined,
        brandNameId: attribute.brandNameId ?? undefined,
        status: attribute.status,
        displayOrder: attribute.displayOrder ?? 0,
      });
    }
  }, [isEdit, response, form]);

  const name = form.watch('name');

  useEffect(() => {
    if (isEdit || codeTouched) return;
    const generated = codeFromName(name ?? '');
    if (generated !== form.getValues('code')) form.setValue('code', generated, { shouldDirty: true, shouldValidate: !!generated });
  }, [name, isEdit, codeTouched, form]);

  const isSaving = createMutation.isPending || updateMutation.isPending;
  useUnsavedChangesWarning(isDirty && !isSaving);

  const save = async (model: CreateMasterAttributeModel) => {
    // HttpService only resolves statuses below 500; a 5xx or network failure throws. Catch it
    // here so a failed save shows a toast and keeps the form instead of an unhandled rejection.
    let result;
    try {
      result = isEdit ? await updateMutation.mutateAsync({ id: id!, model }) : await createMutation.mutateAsync(model);
    } catch {
      toast({ variant: 'destructive', title: 'Could not save', description: <span>Could not reach the server. Please try again.</span> });
      return;
    }

    if (result && (result.status === 200 || result.status === 201)) {
      toast({ variant: 'success', title: `"${model.name}" ${isEdit ? 'updated' : 'created'}` });
      form.reset(model);
      onClose(true);
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(result);
      toast({ variant: 'destructive', title: 'Could not save', description: <span>{error}</span> });
    }
  };

  // Three of the fields live behind the disclosure; if one of them blocks the save, it must unfold
  // so the message is visible instead of the form refusing silently.
  const submit = form.handleSubmit(save, (errors) => {
    if (errors.displayOrder || errors.categoryId || errors.brandNameId) setOptionalOpen(true);
  });

  const handleCancel = () => {
    if (isDirty && !isSaving) {
      setShowLeaveConfirm(true);
      return;
    }
    onClose(false);
  };

  const categoryItems = getAllCategories?.data?.data?.data?.data?.map((item) => ({ value: item.id, label: item.name })) ?? [];
  const brandItems = getAllBrandNames?.data?.data?.data?.data?.map((item) => ({ value: item.id, label: item.name })) ?? [];

  const showSkeleton = isEdit && isFetching;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-xl" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader className="space-y-0 border-b bg-muted/30 px-6 py-4 text-left">
            <div className="flex items-center gap-3 pr-8">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ListChecks className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate text-base">{isEdit ? 'Edit attribute' : 'New attribute'}</DialogTitle>
                <DialogDescription className="mt-1 text-xs">
                  <kbd className="rounded border bg-background px-1 font-mono text-[10px]">Ctrl</kbd> +{' '}
                  <kbd className="rounded border bg-background px-1 font-mono text-[10px]">Enter</kbd> saves.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {showSkeleton ? (
            <div className="space-y-4 px-6 py-5" aria-busy="true" aria-label="Loading attribute">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : fetchFailed ? (
            <div className="px-6 py-10 text-center">
              <CardDescription className="text-sm font-semibold text-destructive">Could not load this attribute</CardDescription>
              <CardDescription className="mt-1 text-xs text-muted-foreground">It may have been deleted. Close and refresh the list.</CardDescription>
            </div>
          ) : (
            <Form {...form}>
              <form autoComplete="off" onSubmit={submit} onKeyDown={submitOnCtrlEnter(submit)} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Size, Color, Weight" autoFocus {...field} value={field.value ?? ''} />
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
                        <div className="flex items-center justify-between">
                          <FormLabel>Code *</FormLabel>
                          {isEdit && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 gap-1 px-2 text-xs text-muted-foreground"
                              onClick={() => setCodeUnlocked((v) => !v)}
                            >
                              {codeUnlocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                              {codeUnlocked ? 'Lock' : 'Change code'}
                            </Button>
                          )}
                        </div>
                        <FormControl>
                          <Input
                            placeholder="SIZE"
                            className="h-10 font-mono uppercase"
                            disabled={!codeUnlocked}
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              setCodeTouched(true);
                              field.onChange(e.target.value.toUpperCase().replace(/\s+/g, '_'));
                            }}
                          />
                        </FormControl>
                        {isEdit && codeUnlocked ? (
                          <p className="flex items-start gap-1.5 text-xs text-warning">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            Changing the code breaks every screen that selects this attribute by its old code. Renaming the label is safe.
                          </p>
                        ) : (
                          !isEdit &&
                          !codeTouched && <FormDescription className="text-xs">Generated from the name. Type here to set your own.</FormDescription>
                        )}
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

                  <OptionalSection title="Scope & display order" open={optionalOpen} onOpenChange={setOptionalOpen}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <SelectSearch
                                  buttonClass="w-full"
                                  placeholder="All categories"
                                  items={categoryItems}
                                  value={field.value ?? ''}
                                  containerName="master-attribute-dialog-category"
                                  onChange={(value) => field.onChange(value ? Number(value) : undefined)}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="brandNameId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Brand</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <SelectSearch
                                  buttonClass="w-full"
                                  placeholder="All brands"
                                  items={brandItems}
                                  value={field.value ?? ''}
                                  containerName="master-attribute-dialog-brand"
                                  onChange={(value) => field.onChange(value ? Number(value) : undefined)}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="displayOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display order</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? null : +e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </OptionalSection>
                </div>

                <DialogFooter className="gap-2 border-t bg-muted/30 px-6 py-3 sm:justify-between">
                  <DirtyNote dirty={isDirty} />
                  <div className="flex flex-col-reverse gap-2 sm:flex-row">
                    <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
                      Cancel
                    </Button>
                    <Button type="submit" loading={isSaving}>
                      {isEdit ? 'Save changes' : 'Create attribute'}
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            </Form>
          )}
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
        bodyText="You have unsaved edits. Close without saving?"
        noButtonText="Keep editing"
        yesButtonText="Discard"
      />
    </>
  );
}
