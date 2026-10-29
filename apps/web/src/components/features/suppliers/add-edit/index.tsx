'use client';
import ConfirmBox from '@/components/common/confirm-box';
import { submitOnCtrlEnter } from '@/lib/form-shortcuts';
import { DirtyNote } from '@/components/common/field';
import OptionalSection from '@/components/common/optional-section';
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

import { useCreateSupplier, useGetSupplierById, useUpdateSupplier } from '@/hooks/service-hooks/useSupplierService';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';

import { CustomResponse, SupplierDto, supplierFields } from '@pms/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { zodResolver } from '@/lib/zod-resolver';
import { Truck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import SupplierView from './view';
import { StatusValues, CreateSupplierModel, normalizeIndianPhone } from '@pms/types';
import { AxiosResponse } from 'axios';

interface ManageSupplierProps {
  /** Omitted when adding; present when viewing or editing an existing supplier. */
  id?: number;
  isOpen: boolean;
  mode?: 'view' | 'edit';
  onClose: (refresh: boolean) => void;
}

// The box holds at most the 10 digits of the subscriber number; the length is capped here, in
// the sanitizer, NOT via maxLength={10} - the browser enforces maxLength on a paste before React
// sees it, which cut "+91 98300 12345" down to "+91 98300 " and fed the sanitizer garbage.
// maxLength={16} merely bounds raw typing; the +91/0091/trunk-0 prefix is peeled off by the same
// helper the API uses, so both ends agree on what a number is.
const sanitizePhone = (value: string) => normalizeIndianPhone(value).slice(0, 10);

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
    resolver: zodResolver(supplierFields),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      status: StatusValues.Draft,
      displayOrder: 0,
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isDirty },
  } = form;

  // Fill once per mount: without the latch a window-focus refetch (new response object) would
  // re-run the effect and overwrite whatever the user has typed since the dialog opened.
  const filledRef = useRef(false);
  useEffect(() => {
    if (!filledRef.current && isEdit && getSupplierResponse.data?.data?.data) {
      filledRef.current = true;
      const supplier = getSupplierResponse.data.data.data;
      reset({
        name: supplier.name,
        email: supplier.email ?? '',
        phone: supplier.phone ?? '',
        address: supplier.address ?? '',
        status: supplier.status,
        displayOrder: supplier.displayOrder ?? 0,
      });
      // An address or a non-default order is already filled in, so the fold must not hide it.
      if (supplier.address?.trim() || (supplier.displayOrder ?? 0) !== 0) setOptionalOpen(true);
    }
  }, [isEdit, getSupplierResponse.data, reset]);

  const address = form.watch('address') ?? '';
  const displayOrder = form.watch('displayOrder');

  const isSaving = createMutation.isPending || updateMutation.isPending;
  useUnsavedChangesWarning(editing && isDirty && !isSaving);

  const save = async (model: CreateSupplierModel) => {
    // HttpService resolves anything under 500, but a 5xx or a dropped connection throws.
    // Catching here keeps the form (and the typed values) instead of an unhandled rejection.
    let response: AxiosResponse<CustomResponse<SupplierDto>>;
    try {
      response = isEdit ? await updateMutation.mutateAsync({ id: id!, model }) : await createMutation.mutateAsync(model);
    } catch {
      toast({ variant: 'destructive', title: 'Could not save', description: <span>Could not reach the server. Please try again.</span> });
      return;
    }

    if (response && (response.status === 200 || response.status === 201) && response.data.data) {
      toast({
        variant: 'success',
        title: 'Record saved successfully',
        description: `"${model.name}" ${isEdit ? 'updated' : 'created'}`,
      });
      reset(model);
      onClose(true);
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({
        variant: 'destructive',
        title: 'Error, Could not save',
        description: <span>{error}</span>,
      });
    }
  };

  const submit = handleSubmit(
    (model) => save(model),
    (errors) => {
      if (errors.address || errors.displayOrder) setOptionalOpen(true);
    }
  );

  const handleCancel = () => {
    if (editing && isDirty && !isSaving) {
      setShowLeaveConfirm(true);
      return;
    }
    onClose(false);
  };

  const showSkeleton = isEdit && getSupplierResponse.isLoading;
  const fetchFailed = isEdit && getSupplierResponse.isError;

  const optionalSummary = [address.trim() ? 'address' : null, displayOrder != null && displayOrder !== 0 ? `order ${displayOrder}` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
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
                      <kbd className="rounded border bg-background px-1 font-mono text-[10px]">Ctrl</kbd> +{' '}
                      <kbd className="rounded border bg-background px-1 font-mono text-[10px]">Enter</kbd> saves.
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
                  <form autoComplete="off" onSubmit={submit} onKeyDown={submitOnCtrlEnter(submit)} className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Acme Corp" autoFocus {...field} value={field.value ?? ''} />
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
                                <Input type="email" placeholder="jane@acme.com" {...field} value={field.value ?? ''} />
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
                                <Input
                                  type="tel"
                                  inputMode="tel"
                                  autoComplete="tel"
                                  maxLength={16}
                                  placeholder="9876543210"
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={(e) => field.onChange(sanitizePhone(e.target.value))}
                                />
                              </FormControl>
                              {/* <FormDescription className="text-[11px]">10 digits starting 6-9. A +91 or leading 0 is fine.</FormDescription> */}
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
                              <StatusSwitch value={field.value} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <OptionalSection title="Address & display order" summary={optionalSummary} open={optionalOpen} onOpenChange={setOptionalOpen}>
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Textarea
                                  className="resize-none"
                                  rows={2}
                                  placeholder="Street, city, state, ZIP"
                                  {...field}
                                  value={field.value ?? ''}
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
                                  type="number"
                                  inputMode="numeric"
                                  min={0}
                                  placeholder="0"
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
