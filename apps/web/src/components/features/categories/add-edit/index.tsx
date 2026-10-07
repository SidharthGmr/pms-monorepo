'use client';
import { ProductImageUploader } from '@/components/common/admin-media/product-image-uploader';
import StatusCards from '@/components/common/status-cards';
import ConfirmBox from '@/components/common/confirm-box';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { StatusValues } from '@/enums/status-values.enum';
import { useCreateCategory, useGetAllCategories, useGetCategoryById, useUpdateCategory } from '@/hooks/service-hooks/useCategoryService';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';
import { cn } from '@/lib/utils';
import { zodResolver } from '@/lib/zod-resolver';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { CategoryModel, CategoryResponseDto, categoryFields } from '@pms/types';
import { ChevronDown, FolderTree } from 'lucide-react';
import { KeyboardEvent, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import CategoryView from './view';

interface ManageCategoryProps {
  id?: number;
  isOpen: boolean;
  /** `view` opens read-only with an Edit button; `edit` goes straight to the form. */
  mode?: 'view' | 'edit';
  /** Shown in view mode; the list already knows every parent's name. */
  parentName?: string;
  onClose: (refresh: boolean) => void;
}

const DEFAULT_VALUES: CategoryModel = {
  name: '',
  description: '',
  images: [],
  parentId: null,
  status: StatusValues.Published,
  displayOrder: undefined,
};

// One dialog for Add, View and Edit: no id creates, an id edits, and mode="view" opens read-only.
// Escape and the X go through the dirty check; clicking outside does nothing so a stray click cannot discard edits.
export default function ManageCategory({ id, isOpen, mode = 'edit', parentName, onClose }: ManageCategoryProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;

  const [editing, setEditing] = useState(mode === 'edit');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [optionalOpen, setOptionalOpen] = useState(false);

  const getAllCategories = useGetAllCategories({ showAllRecords: true });
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const getCategoryResponse = useGetCategoryById(id ?? 0, isEdit && editing);

  const form = useForm<CategoryModel>({
    resolver: zodResolver(categoryFields),
    defaultValues: DEFAULT_VALUES,
  });
  const {
    reset,
    formState: { isDirty },
  } = form;

  const fillCategoryDetails = (data: CategoryResponseDto) => {
    reset({
      name: data.name,
      description: data.description ?? '',
      images: data.images ?? [],
      parentId: data.parentId ?? null,
      status: data.status,
      displayOrder: data.displayOrder ?? undefined,
    });
  };

  useEffect(() => {
    if (getCategoryResponse.status === 'success' && getCategoryResponse.data?.data.data) {
      fillCategoryDetails(getCategoryResponse.data.data.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getCategoryResponse.status, getCategoryResponse.data?.data?.data]);

  const images = form.watch('images') ?? [];
  const parentId = form.watch('parentId');
  const displayOrder = form.watch('displayOrder');
  const description = form.watch('description') ?? '';

  const isSaving = createCategory.isPending || updateCategory.isPending;
  useUnsavedChangesWarning(editing && isDirty && !isSaving);

  // The API rejects self-parenting, so don't offer the category being edited as its own parent.
  // "None" comes first so a chosen parent can be cleared again; without it the field could
  // only ever move to another parent. Drafts stay selectable but are labelled.
  const allCategories = getAllCategories?.data?.data?.data?.data ?? [];
  const parentOptions = [
    { value: '', label: 'None (top level)' },
    ...allCategories.filter((item) => !isEdit || item.id !== id).map((item) => ({ value: item.id, label: item.status === StatusValues.Draft ? `${item.name} (Draft)` : item.name })),
  ];

  const save = async (model: CategoryModel) => {
    const response = isEdit ? await updateCategory.mutateAsync({ id: id!, model }) : await createCategory.mutateAsync(model);

    if (response && (response.status === 200 || response.status === 201) && response.data.data) {
      toast({ variant: 'success', title: `"${response.data.data.name}" ${isEdit ? 'updated' : 'created'}` });
      reset(model);
      onClose(true);
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Could not save', description: <span>{error}</span> });
    }
  };

  // Four of the fields live behind the disclosure; if one of them blocks the save, it must unfold
  // so the message is visible instead of the form refusing silently.
  const submit = form.handleSubmit(
    (model) => save(model),
    (errors) => {
      if (errors.images || errors.displayOrder || errors.description || errors.parentId) setOptionalOpen(true);
    }
  );

  const handleCancel = () => {
    if (editing && isDirty && !isSaving) {
      setShowLeaveConfirm(true);
      return;
    }
    onClose(false);
  };

  // Ctrl/Cmd+Enter saves from anywhere in the form, so a keyboard user never has to reach the footer.
  const onFormKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  const showSkeleton = isEdit && getCategoryResponse.isLoading;
  const fetchFailed = isEdit && getCategoryResponse.isError;

  const parentLabel = parentId == null ? null : (allCategories.find((item) => item.id === parentId)?.name ?? `#${parentId}`);
  const optionalSummary = [
    parentLabel ? `in ${parentLabel}` : null,
    images.length > 0 ? `${images.length} ${images.length === 1 ? 'image' : 'images'}` : null,
    displayOrder != null && String(displayOrder) !== '' ? `order ${displayOrder}` : null,
    description.trim() ? 'description' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && (editing ? handleCancel() : onClose(false))}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
          {!editing ? (
            <CategoryView id={id ?? 0} parentName={parentName} onEdit={() => setEditing(true)} onClose={() => onClose(false)} />
          ) : (
            <>
              <DialogHeader className="space-y-0 border-b bg-muted/30 px-6 py-4 text-left">
                <div className="flex items-center gap-3 pr-8">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FolderTree className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="truncate text-base">{isEdit ? 'Edit category' : 'New category'}</DialogTitle>
                    <DialogDescription className="mt-1 text-xs">
                      <kbd className="rounded border bg-background px-1 font-mono text-[10px]">Ctrl</kbd> + <kbd className="rounded border bg-background px-1 font-mono text-[10px]">Enter</kbd> saves.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {showSkeleton ? (
                <div className="space-y-4 px-6 py-5" aria-busy="true" aria-label="Loading category">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : fetchFailed ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm font-semibold text-destructive">Could not load this category</p>
                  <p className="mt-1 text-xs text-muted-foreground">It may have been deleted. Close and refresh the list.</p>
                </div>
              ) : (
                <Form {...form}>
                  <form autoComplete="off" onSubmit={submit} onKeyDown={onFormKeyDown} className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Footwear, Electronics" autoFocus className="h-10" {...field} />
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
                          <span className="min-w-0 flex-1 text-sm font-semibold leading-tight">Parent, image &amp; more</span>
                          {!optionalOpen && optionalSummary && <span className="hidden truncate text-[11px] text-muted-foreground sm:inline">{optionalSummary}</span>}
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Optional</span>
                          <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', optionalOpen && 'rotate-180')} />
                        </button>

                        {optionalOpen && (
                          <div className="space-y-5 border-t px-4 py-4">
                            <FormField
                              control={form.control}
                              name="parentId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Parent category</FormLabel>
                                  <FormControl>
                                    <SelectSearch
                                      buttonClass="w-full"
                                      placeholder="None (top level)"
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
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Textarea rows={3} className="resize-none" placeholder="What belongs in this category…" {...field} value={field.value ?? ''} />
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
                                  <FormLabel>Image</FormLabel>
                                  <FormControl>
                                    <ProductImageUploader value={field.value || []} onChange={field.onChange} />
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
                                      min={0}
                                      placeholder="0"
                                      className="h-10 sm:max-w-[160px]"
                                      name={field.name}
                                      ref={field.ref}
                                      onBlur={field.onBlur}
                                      value={field.value ?? ''}
                                      // The validator wants a number. A plain text input handed it a string, so
                                      // any edit failed with "expected number". An empty box means "not set":
                                      // create falls back to the DB default of 0, update leaves it unchanged.
                                      onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                    />
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
                        <Button type="submit" loading={isSaving}>
                          {isEdit ? 'Save changes' : 'Create category'}
                        </Button>
                      </div>
                    </DialogFooter>
                  </form>
                </Form>
              )}
            </>
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
        bodyText="This category has unsaved changes. Closing now will lose them."
        noButtonText="Keep editing"
        yesButtonText="Discard"
      />
    </>
  );
}
