'use client';
import ConfirmBox from '@/components/common/confirm-box';
import StatusCards from '@/components/common/status-cards';
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
import { useCreateSupplier, useGetSupplierById, useUpdateSupplier } from '@/hooks/service-hooks/useSupplierService';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';
import { cn } from '@/lib/utils';
import { CreateSupplierModel } from '@/models/supplier.model';
import SupplierSchema from '@/schema/supplierSchema';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { yupResolver } from '@hookform/resolvers/yup';
import { ChevronDown, Truck } from 'lucide-react';
import { KeyboardEvent, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import SupplierView from './view';

interface ManageSupplierProps {
  id?: number;
  isOpen: boolean;
  /** `view` opens read-only with an Edit button; `edit` goes straight to the form. */
  mode?: 'view' | 'edit';
  onClose: (refresh: boolean) => void;
}

const DEFAULT_VALUES: CreateSupplierModel = {
  name: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
  status: StatusValues.Draft,
  displayOrder: 0,
};

// One dialog for Add, View and Edit: no id creates, an id edits, and mode="view" opens read-only.
// Escape and the X go through the dirty check; clicking outside does nothing so a stray click cannot discard edits.
export default function ManageSupplier({ id, isOpen, mode = 'edit', onClose }: ManageSupplierProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;

  const [editing, setEditing] = useState(mode === 'edit');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [optionalOpen, setOptionalOpen] = useState(false);

  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const getSupplierResponse = useGetSupplierById(id ?? 0, isEdit && editing);

  const form = useForm<CreateSupplierModel>({
    resolver: yupResolver(SupplierSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const {
    reset,
    formState: { isDirty },
  } = form;

  useEffect(() => {
    if (isEdit && getSupplierResponse.data?.data?.data) {
      const supplier = getSupplierResponse.data.data.data;
      reset({
        name: supplier.name,
        contactPerson: supplier.contactPerson ?? '',
        email: supplier.email ?? '',
        phone: supplier.phone ?? '',
        address: supplier.address ?? '',
        notes: supplier.notes ?? '',
        status: supplier.status,
        displayOrder: supplier.displayOrder ?? 0,
      });
    }
  }, [isEdit, getSupplierResponse.data, reset]);

  const contactPerson = form.watch('contactPerson') ?? '';
  const address = form.watch('address') ?? '';
  const notes = form.watch('notes') ?? '';
  const displayOrder = form.watch('displayOrder');

  const isSaving = createMutation.isPending || updateMutation.isPending;
  useUnsavedChangesWarning(editing && isDirty && !isSaving);

  const save = async (model: CreateSupplierModel) => {
    const response = isEdit ? await updateMutation.mutateAsync({ id: id!, model }) : await createMutation.mutateAsync(model);

    if (response && (response.status === 200 || response.status === 201)) {
      toast({ variant: 'success', title: `"${model.name}" ${isEdit ? 'updated' : 'created'}` });
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
      if (errors.contactPerson || errors.address || errors.notes || errors.displayOrder) setOptionalOpen(true);
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

  const showSkeleton = isEdit && getSupplierResponse.isLoading;
  const fetchFailed = isEdit && getSupplierResponse.isError;

  const optionalSummary = [
    contactPerson.trim() || null,
    address.trim() ? 'address' : null,
    notes.trim() ? 'notes' : null,
    displayOrder != null && String(displayOrder) !== '' && displayOrder !== 0 ? `order ${displayOrder}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && (editing ? handleCancel() : onClose(false))}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
          {!editing ? (
            <SupplierView id={id ?? 0} onEdit={() => setEditing(true)} onClose={() => onClose(false)} />
          ) : (
            <>
              <DialogHeader className="space-y-0 border-b bg-muted/30 px-6 py-4 text-left">
                <div className="flex items-center gap-3 pr-8">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Truck className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="truncate text-base">{isEdit ? 'Edit supplier' : 'New supplier'}</DialogTitle>
                    <DialogDescription className="mt-1 text-xs">
                      <kbd className="rounded border bg-background px-1 font-mono text-[10px]">Ctrl</kbd> + <kbd className="rounded border bg-background px-1 font-mono text-[10px]">Enter</kbd> saves.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {showSkeleton ? (
                <div className="space-y-4 px-6 py-5" aria-busy="true" aria-label="Loading supplier">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : fetchFailed ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm font-semibold text-destructive">Could not load this supplier</p>
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
                              <Input placeholder="e.g. Acme Corp" autoFocus className="h-10" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="jane@acme.com" className="h-10" {...field} value={field.value ?? ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone *</FormLabel>
                              <FormControl>
                                <Input placeholder="+1 555 123 4567" className="h-10" {...field} value={field.value ?? ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

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
                          <span className="min-w-0 flex-1 text-sm font-semibold leading-tight">Contact person, address &amp; more</span>
                          {!optionalOpen && optionalSummary && <span className="hidden truncate text-[11px] text-muted-foreground sm:inline">{optionalSummary}</span>}
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Optional</span>
                          <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', optionalOpen && 'rotate-180')} />
                        </button>

                        {optionalOpen && (
                          <div className="space-y-5 border-t px-4 py-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <FormField
                                control={form.control}
                                name="contactPerson"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Contact person</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g. Jane Smith" className="h-10" {...field} value={field.value ?? ''} />
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
                              name="address"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Address</FormLabel>
                                  <FormControl>
                                    <Textarea className="resize-none" rows={2} placeholder="Street, city, state, ZIP" {...field} value={field.value ?? ''} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="notes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Notes</FormLabel>
                                  <FormControl>
                                    <Textarea className="resize-none" rows={2} placeholder="Payment terms, lead times…" {...field} value={field.value ?? ''} />
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
                          {isEdit ? 'Save changes' : 'Create supplier'}
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
        bodyText="This supplier has unsaved changes. Closing now will lose them."
        noButtonText="Keep editing"
        yesButtonText="Discard"
      />
    </>
  );
}
