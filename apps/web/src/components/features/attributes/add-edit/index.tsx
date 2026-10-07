'use client';
import ConfirmBox from '@/components/common/confirm-box';
import StatusCards from '@/components/common/status-cards';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { StatusValues } from '@/enums/status-values.enum';
import { useCreateAttribute, useGetAttributeById, useUpdateAttribute } from '@/hooks/service-hooks/useAttributeService';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';
import { cn } from '@/lib/utils';
import { zodResolver } from '@/lib/zod-resolver';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { AttributeModel, attributeFields } from '@pms/types';
import { ChevronDown, Ruler } from 'lucide-react';
import { KeyboardEvent, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import AttributeView from './view';

interface ManageAttributeProps {
  id?: number;
  isOpen: boolean;
  /** `view` opens read-only with an Edit button; `edit` goes straight to the form. */
  mode?: 'view' | 'edit';
  onClose: (refresh: boolean) => void;
}

const DEFAULT_VALUES: AttributeModel = {
  name: '',
  unit: '',
  status: StatusValues.Draft,
  displayOrder: null,
};

// One dialog for Add, View and Edit: no id creates, an id edits, and mode="view" opens read-only.
// Escape and the X go through the dirty check; clicking outside does nothing so a stray click cannot discard edits.
export default function ManageAttribute({ id, isOpen, mode = 'edit', onClose }: ManageAttributeProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;

  const [editing, setEditing] = useState(mode === 'edit');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [optionalOpen, setOptionalOpen] = useState(false);

  const createMutation = useCreateAttribute();
  const updateMutation = useUpdateAttribute();
  const getAttributeResponse = useGetAttributeById(id ?? 0, isEdit && editing);

  const form = useForm<AttributeModel>({
    resolver: zodResolver(attributeFields),
    defaultValues: DEFAULT_VALUES,
  });
  const {
    reset,
    formState: { isDirty },
  } = form;

  useEffect(() => {
    if (isEdit && getAttributeResponse.data?.data?.data) {
      const attribute = getAttributeResponse.data.data.data;
      reset({ name: attribute.name, unit: attribute.unit ?? '', status: attribute.status, displayOrder: attribute.displayOrder ?? null });
    }
  }, [isEdit, getAttributeResponse.data, reset]);

  const unit = form.watch('unit') ?? '';
  const displayOrder = form.watch('displayOrder');

  const isSaving = createMutation.isPending || updateMutation.isPending;
  useUnsavedChangesWarning(editing && isDirty && !isSaving);

  const save = async (model: AttributeModel) => {
    const payload = { ...model, unit: model.unit || null };
    const response = isEdit ? await updateMutation.mutateAsync({ id: id!, model: payload }) : await createMutation.mutateAsync(payload);

    if (response && (response.status === 200 || response.status === 201)) {
      toast({ variant: 'success', title: `"${model.name}" ${isEdit ? 'updated' : 'created'}` });
      reset(model);
      onClose(true);
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Could not save', description: <span>{error}</span> });
    }
  };

  // Two of the fields live behind the disclosure; if one of them blocks the save, it must unfold
  // so the message is visible instead of the form refusing silently.
  const submit = form.handleSubmit(
    (model) => save(model),
    (errors) => {
      if (errors.unit || errors.displayOrder) setOptionalOpen(true);
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

  const showSkeleton = isEdit && getAttributeResponse.isLoading;
  const fetchFailed = isEdit && getAttributeResponse.isError;

  const optionalSummary = [unit.trim() ? `unit ${unit.trim()}` : null, displayOrder != null && String(displayOrder) !== '' ? `order ${displayOrder}` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && (editing ? handleCancel() : onClose(false))}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
          {!editing ? (
            <AttributeView id={id ?? 0} onEdit={() => setEditing(true)} onClose={() => onClose(false)} />
          ) : (
            <>
              <DialogHeader className="space-y-0 border-b bg-muted/30 px-6 py-4 text-left">
                <div className="flex items-center gap-3 pr-8">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Ruler className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="truncate text-base">{isEdit ? 'Edit attribute' : 'New attribute'}</DialogTitle>
                    <DialogDescription className="mt-1 text-xs">
                      <kbd className="rounded border bg-background px-1 font-mono text-[10px]">Ctrl</kbd> + <kbd className="rounded border bg-background px-1 font-mono text-[10px]">Enter</kbd> saves.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {showSkeleton ? (
                <div className="space-y-4 px-6 py-5" aria-busy="true" aria-label="Loading attribute">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : fetchFailed ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm font-semibold text-destructive">Could not load this attribute</p>
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
                              <Input placeholder="e.g. Color, Weight, Material" autoFocus className="h-10" {...field} value={field.value ?? ''} />
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
                          <span className="min-w-0 flex-1 text-sm font-semibold leading-tight">Unit &amp; display order</span>
                          {!optionalOpen && optionalSummary && <span className="hidden truncate text-[11px] text-muted-foreground sm:inline">{optionalSummary}</span>}
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Optional</span>
                          <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', optionalOpen && 'rotate-180')} />
                        </button>

                        {optionalOpen && (
                          <div className="grid gap-4 border-t px-4 py-4 sm:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="unit"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Unit</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. kg, cm" className="h-10" {...field} value={field.value ?? ''} />
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
                                      className="h-10"
                                      name={field.name}
                                      ref={field.ref}
                                      onBlur={field.onBlur}
                                      value={field.value ?? ''}
                                      // Clearing the box means "no position", not position 0.
                                      onChange={(e) => field.onChange(e.target.value === '' ? null : +e.target.value)}
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
                          {isEdit ? 'Save changes' : 'Create attribute'}
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
        bodyText="This attribute has unsaved changes. Closing now will lose them."
        noButtonText="Keep editing"
        yesButtonText="Discard"
      />
    </>
  );
}
