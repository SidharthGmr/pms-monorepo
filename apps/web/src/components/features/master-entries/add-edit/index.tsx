'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { submitOnCtrlEnter } from '@/lib/form-shortcuts';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Plus, Sparkles, X } from 'lucide-react';
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
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';

import {
  useCreateMasterEntry,
  useGetAllMasterAttributes,
  useGetMasterEntryById,
  useUpdateMasterEntry,
} from '@/hooks/service-hooks/useMasterEntryService';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';

import { MasterEntrySchema } from '@/schema/masterEntrySchema';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { StatusValues, CreateMasterEntryModel, UpdateMasterEntryModel, CustomResponse, MasterEntryDto } from '@pms/types';
import type { AxiosResponse } from 'axios';

interface ManageMasterEntryProps {
  id?: number;
  defaultAttributeId?: number;
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

const defaults = (attributeId?: number): CreateMasterEntryModel => ({
  attributeId: attributeId ?? 0,
  values: [''],
  status: StatusValues.Published,
  displayOrder: 0,
});

// One dialog for Add and Edit, structured like ManageCategory: no id creates, an id edits.
// Add collects a list of values and creates one entry each; edit works on the single row it
// opened, so the same array holds exactly one value there.
// Escape and the X go through the dirty check; clicking outside does nothing so a stray click cannot discard edits.
export default function ManageMasterEntry({ id, defaultAttributeId, isOpen, onClose }: ManageMasterEntryProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;

  const createMutation = useCreateMasterEntry();
  const updateMutation = useUpdateMasterEntry();
  const { data: response, isLoading: isFetching, isError: fetchFailed } = useGetMasterEntryById(id ?? 0, isEdit);
  const { data: attributesResponse } = useGetAllMasterAttributes({ showAllRecords: true, status: StatusValues.Published });

  const attributes = useMemo(() => attributesResponse?.data?.data?.data ?? [], [attributesResponse]);
  const attributeItems = useMemo(
    () => attributes.map((attribute) => ({ label: `${attribute.name} (${attribute.code})`, value: attribute.id })),
    [attributes]
  );

  // savedRef is set once anything was saved so a later Cancel still tells the list to refresh.
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [optionalOpen, setOptionalOpen] = useState(false);
  const savedRef = useRef(false);
  const firstValueRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<CreateMasterEntryModel>({
    resolver: yupResolver(MasterEntrySchema),
    defaultValues: defaults(defaultAttributeId),
  });
  const {
    formState: { isDirty, errors },
  } = form;

  // Fill once per mount: without the latch a window-focus refetch (new response object) would
  // re-run the effect and overwrite whatever the user has typed since the dialog opened.
  const filledRef = useRef(false);
  useEffect(() => {
    if (!filledRef.current && isEdit && response?.data?.data) {
      filledRef.current = true;
      const entry = response.data.data;
      form.reset({
        attributeId: entry.attributeId,
        values: [entry.value],
        status: entry.status,
        displayOrder: entry.displayOrder ?? 0,
      });
    }
  }, [isEdit, response, form]);

  const values = form.watch('values') ?? [''];

  // Primitive arrays do not fit useFieldArray, which keys off object ids, so the list is
  // rewritten in place - shouldDirty keeps the unsaved-changes guard honest.
  const setValues = (next: string[]) => form.setValue('values', next, { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
  const addValue = () => setValues([...values, '']);
  const removeValue = (index: number) => setValues(values.filter((_, position) => position !== index));

  const isSaving = createMutation.isPending || updateMutation.isPending;
  useUnsavedChangesWarning(isDirty && !isSaving);

  // "Save & add another" keeps the attribute and status, since values added in a row belong to the same group.
  const save = async (model: CreateMasterEntryModel, addAnother: boolean) => {
    const cleaned = Array.from(new Set((model.values ?? []).map((value) => value.trim()).filter(Boolean)));

    // HttpService only resolves statuses below 500; a 5xx or network failure throws. Catch it
    // here so a failed save shows a toast and keeps the form instead of an unhandled rejection.
    let result: AxiosResponse<CustomResponse<MasterEntryDto | MasterEntryDto[]>> | undefined;
    try {
      if (isEdit) {
        const payload: UpdateMasterEntryModel = {
          attributeId: model.attributeId,
          value: cleaned[0],
          status: model.status,
          displayOrder: model.displayOrder,
        };
        result = await updateMutation.mutateAsync({ id: id!, model: payload });
      } else {
        result = await createMutation.mutateAsync({ ...model, values: cleaned });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Could not save', description: <span>Could not reach the server. Please try again.</span> });
      return;
    }

    if (result && (result.status === 200 || result.status === 201)) {
      savedRef.current = true;
      const title = isEdit ? `"${cleaned[0]}" updated` : cleaned.length === 1 ? `"${cleaned[0]}" created` : `${cleaned.length} values created`;
      toast({ variant: 'success', title });
      if (addAnother) {
        form.reset({ ...defaults(model.attributeId), status: model.status, displayOrder: (model.displayOrder ?? 0) + cleaned.length });
        firstValueRef.current?.focus();
      } else {
        onClose(true);
      }
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(result);
      toast({ variant: 'destructive', title: 'Could not save', description: <span>{error}</span> });
    }
  };

  // Display order lives behind the disclosure; if it blocks the save, it must unfold so the
  // message is visible instead of the form refusing silently.
  const submit = (addAnother: boolean) =>
    form.handleSubmit(
      (model) => save(model, addAnother),
      (formErrors) => {
        if (formErrors.displayOrder) setOptionalOpen(true);
      }
    );

  const handleCancel = () => {
    if (isDirty && !isSaving) {
      setShowLeaveConfirm(true);
      return;
    }
    onClose(savedRef.current);
  };

  const showSkeleton = isEdit && isFetching;
  const valuesError = Array.isArray(errors.values) ? undefined : errors.values?.message;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-xl" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader className="space-y-0 border-b bg-muted/30 px-6 py-4 text-left">
            <div className="flex items-center gap-3 pr-8">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate text-base">{isEdit ? 'Edit value' : 'New values'}</DialogTitle>
                <DialogDescription className="mt-1 text-xs">
                  <kbd className="rounded border bg-background px-1 font-mono text-[10px]">Ctrl</kbd> +{' '}
                  <kbd className="rounded border bg-background px-1 font-mono text-[10px]">Enter</kbd> saves.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {showSkeleton ? (
            <div className="space-y-4 px-6 py-5" aria-busy="true" aria-label="Loading value">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : fetchFailed ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-semibold text-destructive">Could not load this value</p>
              <p className="mt-1 text-xs text-muted-foreground">It may have been deleted. Close and refresh the list.</p>
            </div>
          ) : (
            <Form {...form}>
              <form autoComplete="off" onSubmit={submit(false)} onKeyDown={submitOnCtrlEnter(submit(false))} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                  <FormField
                    control={form.control}
                    name="attributeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Attribute *</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <SelectSearch
                              placeholder="Select attribute"
                              buttonClass="w-full"
                              items={attributeItems}
                              value={field.value || undefined}
                              valueType="number"
                              containerName="master-entry-dialog-attribute"
                              onChange={(value) => field.onChange(+value)}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>{isEdit ? 'Stored value *' : 'Stored values *'}</FormLabel>
                    {values.map((_, index) => (
                      <FormField
                        key={index}
                        control={form.control}
                        name={`values.${index}` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Input
                                  placeholder="e.g. L"
                                  autoFocus={index === 0}
                                  className="h-10 font-mono"
                                  {...field}
                                  ref={(el) => {
                                    field.ref(el);
                                    if (index === 0) firstValueRef.current = el;
                                  }}
                                  value={field.value ?? ''}
                                />
                                {!isEdit && values.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 shrink-0 text-muted-foreground"
                                    onClick={() => removeValue(index)}
                                    aria-label={`Remove value ${index + 1}`}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                    {valuesError && <p className="text-sm font-medium text-destructive">{valuesError}</p>}
                    {!isEdit && (
                      <>
                        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={addValue}>
                          <Plus className="h-3.5 w-3.5" />
                          Add value
                        </Button>
                        <p className="text-[11px] text-muted-foreground">Each value is saved as its own entry under the selected attribute.</p>
                      </>
                    )}
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

                  <OptionalSection title="Display order" open={optionalOpen} onOpenChange={setOptionalOpen}>
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
                    {!isEdit && (
                      <Button type="button" variant="secondary" loading={isSaving} onClick={submit(true)}>
                        Save &amp; add another
                      </Button>
                    )}
                    <Button type="submit" loading={isSaving}>
                      {isEdit ? 'Save changes' : 'Create values'}
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
          onClose(savedRef.current);
        }}
        heading="Discard changes?"
        bodyText="This value has unsaved changes. Closing now will lose them."
        noButtonText="Keep editing"
        yesButtonText="Discard"
      />
    </>
  );
}
