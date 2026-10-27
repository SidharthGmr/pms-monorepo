'use client';
import { SingleImageUpload } from '@/components/common/admin-media/single-image-upload';
import { submitOnCtrlEnter } from '@/lib/form-shortcuts';
import CharCounter from '@/components/common/char-counter';
import ConfirmBox from '@/components/common/confirm-box';
import { DirtyNote } from '@/components/common/field';
import OptionalSection from '@/components/common/optional-section';
import { SelectSearch } from '@/components/common/select-search';
import StatusSwitch from '@/components/common/status-switch';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';

import { useCreateCategory, useGetAllCategories, useGetCategoryById, useUpdateCategory } from '@/hooks/service-hooks/useCategoryService';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';
import { zodResolver } from '@/lib/zod-resolver';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { CategoryModel, CategoryResponseDto, categoryFields, StatusValues } from '@pms/types';
import { FolderTree } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import CategoryView from './view';

interface ManageCategoryProps {
  id?: number;
  isOpen: boolean;
  mode?: 'view' | 'edit';
  parentName?: string;
  onClose: (refresh: boolean) => void;
}

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

  // Fill once per mount: without the latch a window-focus refetch (new response object) would
  // re-run the effect and overwrite whatever the user has typed since the dialog opened.
  const filledRef = useRef(false);
  useEffect(() => {
    if (!filledRef.current && getCategoryResponse.status === 'success' && getCategoryResponse.data?.data.data) {
      filledRef.current = true;
      fillCategoryDetails(getCategoryResponse.data.data.data);
    }
  }, [getCategoryResponse.status, getCategoryResponse.data?.data?.data]);

  const isSaving = createCategory.isPending || updateCategory.isPending;
  useUnsavedChangesWarning(editing && isDirty && !isSaving);

  // The API rejects self-parenting, so don't offer the category being edited as its own parent.
  // "None" comes first so a chosen parent can be cleared again; without it the field could
  // only ever move to another parent. Drafts stay selectable but are labelled.
  const allCategories = getAllCategories?.data?.data?.data?.data ?? [];
  const parentOptions = [
    { value: '', label: 'None (top level)' },
    ...allCategories
      .filter((item) => !isEdit || item.id !== id)
      .map((item) => ({ value: item.id, label: item.status === StatusValues.Draft ? `${item.name} (Draft)` : item.name })),
  ];

  const save = async (model: CategoryModel) => {
    let response;
    try {
      response = isEdit ? await updateCategory.mutateAsync({ id: id!, model }) : await createCategory.mutateAsync(model);
    } catch {
      toast({ variant: 'destructive', title: 'Could not save', description: <span>Could not reach the server. Please try again.</span> });
      return;
    }

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

  const showSkeleton = isEdit && getCategoryResponse.isLoading;
  const fetchFailed = isEdit && getCategoryResponse.isError;

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
                      <kbd className="rounded border bg-background px-1 font-mono text-[10px]">Ctrl</kbd> +{' '}
                      <kbd className="rounded border bg-background px-1 font-mono text-[10px]">Enter</kbd> saves.
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
                  <form autoComplete="off" onSubmit={submit} onKeyDown={submitOnCtrlEnter(submit)} className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel>Name *</FormLabel>
                              <CharCounter schema={categoryFields} field="name" value={field.value ?? ''} />
                            </div>
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
                              <StatusSwitch value={field.value} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <OptionalSection title="Parent, image & more" open={optionalOpen} onOpenChange={setOptionalOpen}>
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
                                <Textarea
                                  rows={3}
                                  className="resize-none"
                                  placeholder="What belongs in this category…"
                                  {...field}
                                  value={field.value ?? ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* The column stores a list, but a category only ever shows one tile image:
                                the uploader works on the first entry and empties the list when it is removed. */}
                        <FormField
                          control={form.control}
                          name="images"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Image</FormLabel>
                              <FormControl>
                                <SingleImageUpload
                                  value={field.value?.[0] ?? ''}
                                  onChange={(path) => field.onChange(path ? [path] : [])}
                                  folder="categories"
                                  alt="Category image"
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
                                <Input
                                  name={field.name}
                                  ref={field.ref}
                                  onBlur={field.onBlur}
                                  value={field.value ?? ''}
                                  onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
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
