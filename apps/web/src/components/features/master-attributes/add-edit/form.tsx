'use client';
import { forwardRef, KeyboardEvent, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { AlertTriangle, ChevronDown, ListChecks, Lock, Unlock } from 'lucide-react';
import ConfirmBox from '@/components/common/confirm-box';
import { SelectSearch } from '@/components/common/select-search';
import StatusCards from '@/components/common/status-cards';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { StatusValues } from '@/enums/status-values.enum';
import { useGetAllBrandNames } from '@/hooks/service-hooks/useBrandNameService';
import { useGetAllCategories } from '@/hooks/service-hooks/useCategoryService';
import { useCreateMasterAttribute, useGetMasterAttributeById, useUpdateMasterAttribute } from '@/hooks/service-hooks/useMasterEntryService';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';
import { cn } from '@/lib/utils';
import { CreateMasterAttributeModel } from '@/models/master-entry.model';
import { MasterAttributeSchema } from '@/schema/masterEntrySchema';
import IUnitOfService from '@/services/interfaces/IUnitOfService';

/**
 * The dialog form for a variant option, structured like the brand dialog: the required fields up
 * front, everything optional folded behind one disclosure.
 */
export interface MasterAttributeFormProps {
  id?: number;
  /** Called when the form is finished with - `refresh` is true if anything was saved. */
  onClose: (refresh: boolean) => void;
}

export interface MasterAttributeFormHandle {
  /** Runs the same dirty check as the Cancel button, e.g. for a dialog's Escape key. */
  requestClose: () => void;
}

const DEFAULT_VALUES: CreateMasterAttributeModel = {
  name: '',
  code: '',
  description: '',
  unit: '',
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

const MasterAttributeForm = forwardRef<MasterAttributeFormHandle, MasterAttributeFormProps>(function MasterAttributeForm({ id, onClose }, ref) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;

  const createMutation = useCreateMasterAttribute();
  const updateMutation = useUpdateMasterAttribute();
  const { data: response, isLoading: isFetching, isError: fetchFailed } = useGetMasterAttributeById(id ?? 0, isEdit);
  const getAllCategories = useGetAllCategories({ showAllRecords: true });
  const getAllBrandNames = useGetAllBrandNames({ showAllRecords: true });

  // Code follows Name until the user types in it; on edit it starts locked because other screens select by it.
  // savedRef is set once anything was saved so a later Cancel still tells the list to refresh.
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [codeTouched, setCodeTouched] = useState(false);
  const [codeUnlocked, setCodeUnlocked] = useState(!isEdit);
  const savedRef = useRef(false);
  const nameRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<CreateMasterAttributeModel>({
    resolver: yupResolver(MasterAttributeSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const {
    formState: { isDirty },
  } = form;

  useEffect(() => {
    if (isEdit && response?.data?.data) {
      const attribute = response.data.data;
      form.reset({
        name: attribute.name,
        code: attribute.code,
        description: attribute.description ?? '',
        unit: attribute.unit ?? '',
        categoryId: attribute.categoryId ?? undefined,
        brandNameId: attribute.brandNameId ?? undefined,
        status: attribute.status as string,
        displayOrder: attribute.displayOrder ?? 0,
      });
    }
  }, [isEdit, response, form]);

  const name = form.watch('name');
  const unit = form.watch('unit') ?? '';
  const displayOrder = form.watch('displayOrder');
  const description = form.watch('description') ?? '';
  const categoryId = form.watch('categoryId');
  const brandNameId = form.watch('brandNameId');

  useEffect(() => {
    if (isEdit || codeTouched) return;
    const generated = codeFromName(name ?? '');
    if (generated !== form.getValues('code')) form.setValue('code', generated, { shouldDirty: true, shouldValidate: !!generated });
  }, [name, isEdit, codeTouched, form]);

  const isSaving = createMutation.isPending || updateMutation.isPending;
  useUnsavedChangesWarning(isDirty && !isSaving);

  // "Save & add another" keeps status and scope, since several attributes added in a row usually share them.
  const save = async (model: CreateMasterAttributeModel, addAnother: boolean) => {
    const result = isEdit ? await updateMutation.mutateAsync({ id: id!, model }) : await createMutation.mutateAsync(model);

    if (result && (result.status === 200 || result.status === 201)) {
      savedRef.current = true;
      toast({ variant: 'success', title: `"${model.name}" ${isEdit ? 'updated' : 'created'}` });
      if (addAnother) {
        form.reset({ ...DEFAULT_VALUES, status: model.status, categoryId: model.categoryId, brandNameId: model.brandNameId });
        setCodeTouched(false);
        nameRef.current?.focus();
      } else {
        onClose(true);
      }
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(result);
      toast({ variant: 'destructive', title: 'Could not save', description: <span>{error}</span> });
    }
  };

  // Five of the fields live behind the disclosure; if one of them blocks the save, it must unfold
  // so the message is visible instead of the form refusing silently.
  const submit = (addAnother: boolean) =>
    form.handleSubmit(
      (model) => save(model, addAnother),
      (errors) => {
        if (errors.description || errors.unit || errors.displayOrder || errors.categoryId || errors.brandNameId) setOptionalOpen(true);
      }
    );

  const handleCancel = () => {
    if (isDirty && !isSaving) {
      setShowLeaveConfirm(true);
      return;
    }
    onClose(savedRef.current);
  };

  useImperativeHandle(ref, () => ({ requestClose: handleCancel }));

  // Ctrl/Cmd+Enter saves from anywhere in the form, so a keyboard user never has to reach the footer.
  const onFormKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      submit(false)();
    }
  };

  const categoryItems = getAllCategories?.data?.data?.data?.data?.map((item) => ({ value: item.id, label: item.name })) ?? [];
  const brandItems = getAllBrandNames?.data?.data?.data?.data?.map((item) => ({ value: item.id, label: item.name })) ?? [];
  const categoryName = categoryItems.find((c) => c.value === categoryId)?.label;
  const brandName = brandItems.find((b) => b.value === brandNameId)?.label;

  const showSkeleton = isEdit && isFetching;

  const optionalSummary = [
    categoryName ?? null,
    brandName ?? null,
    unit.trim() ? `unit ${unit.trim()}` : null,
    displayOrder != null && String(displayOrder) !== '' && displayOrder !== 0 ? `order ${displayOrder}` : null,
    description.trim() ? 'description' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const header = (
    <div className="flex items-center gap-3 pr-8">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <ListChecks className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <DialogTitle className="truncate text-base">{isEdit ? 'Edit attribute' : 'New attribute'}</DialogTitle>
        <DialogDescription className="mt-1 text-xs">
          <kbd className="rounded border bg-background px-1 font-mono text-[10px]">Ctrl</kbd> + <kbd className="rounded border bg-background px-1 font-mono text-[10px]">Enter</kbd> saves.
        </DialogDescription>
      </div>
    </div>
  );

  let body: JSX.Element;
  if (showSkeleton) {
    body = (
      <div className="space-y-4 px-6 py-5" aria-busy="true" aria-label="Loading attribute">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  } else if (fetchFailed) {
    body = (
      <div className="px-6 py-10 text-center">
        <p className="text-sm font-semibold text-destructive">Could not load this attribute</p>
        <p className="mt-1 text-xs text-muted-foreground">It may have been deleted. Close and refresh the list.</p>
      </div>
    );
  } else {
    body = (
      <Form {...form}>
        <form autoComplete="off" onSubmit={submit(false)} onKeyDown={onFormKeyDown} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Size, Color, Weight"
                      autoFocus
                      className="h-10"
                      {...field}
                      ref={(el) => {
                        field.ref(el);
                        nameRef.current = el;
                      }}
                      value={field.value ?? ''}
                    />
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
                      <Button type="button" variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs text-muted-foreground" onClick={() => setCodeUnlocked((v) => !v)}>
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
                    <p className="flex items-start gap-1.5 text-xs text-amber-600">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Changing the code breaks every screen that selects this attribute by its old code. Renaming the label is safe.
                    </p>
                  ) : (
                    !isEdit && !codeTouched && <FormDescription className="text-xs">Generated from the name. Type here to set your own.</FormDescription>
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
                    <StatusCards value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <section className="overflow-hidden rounded-xl border">
              <button
                type="button"
                onClick={() => setOptionalOpen((open) => !open)}
                aria-expanded={optionalOpen}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-muted/40"
              >
                <span className="min-w-0 flex-1 text-sm font-semibold leading-tight">Scope, unit &amp; more</span>
                {!optionalOpen && optionalSummary && <span className="hidden truncate text-[11px] text-muted-foreground sm:inline">{optionalSummary}</span>}
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Optional</span>
                <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', optionalOpen && 'rotate-180')} />
              </button>

              {optionalOpen && (
                <div className="space-y-5 border-t px-4 py-4">
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <FormControl>
                            <Input placeholder="kg, cm, ml" className="h-10" {...field} value={field.value ?? ''} />
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
                            <Input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              placeholder="0"
                              className="h-10"
                              value={field.value ?? ''}
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea className="resize-none" rows={2} placeholder="What this attribute is for…" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </section>
          </div>

          <DialogFooter className="gap-2 border-t bg-muted/30 px-6 py-3 sm:justify-between">
            <p className={cn('hidden items-center gap-1.5 text-xs sm:flex', isDirty ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground')}>
              {isDirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
              {isDirty ? 'Unsaved changes' : 'No changes yet'}
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              {!isEdit && (
                <Button type="button" variant="secondary" loading={isSaving} onClick={submit(true)}>
                  Save &amp; add another
                </Button>
              )}
              <Button type="submit" loading={isSaving}>
                {isEdit ? 'Save changes' : 'Create attribute'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </Form>
    );
  }

  return (
    <>
      <DialogHeader className="space-y-0 border-b bg-muted/30 px-6 py-4 text-left">{header}</DialogHeader>

      {body}

      <ConfirmBox
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onSubmit={() => {
          setShowLeaveConfirm(false);
          onClose(savedRef.current);
        }}
        heading="Discard changes?"
        bodyText="You have unsaved edits. Close without saving?"
        noButtonText="Keep editing"
        yesButtonText="Discard"
      />
    </>
  );
});

export default MasterAttributeForm;
