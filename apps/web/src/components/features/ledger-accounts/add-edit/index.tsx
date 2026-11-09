'use client';
import CharCounter from '@/components/common/char-counter';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import {
  useCreateLedgerAccount,
  useGetAllLedgerAccounts,
  useGetLedgerAccountById,
  useUpdateLedgerAccount,
} from '@/hooks/service-hooks/useLedgerAccountService';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';
import { submitOnCtrlEnter } from '@/lib/form-shortcuts';
import { zodResolver } from '@/lib/zod-resolver';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import {
  ACCOUNT_CATEGORY_LABELS,
  ACCOUNT_SUB_TYPE_LABELS,
  AccountCategory,
  AccountSubTypeEnum,
  LedgerAccountDto,
  LedgerAccountModel,
  ledgerAccountFields,
  StatusValues,
} from '@pms/types';
import { BookOpen } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

interface ManageLedgerAccountProps {
  id?: number;
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

const CATEGORY_OPTIONS = Object.entries(ACCOUNT_CATEGORY_LABELS).map(([value, label]) => ({ value, label }));
const SUB_TYPE_OPTIONS = Object.entries(ACCOUNT_SUB_TYPE_LABELS).map(([value, label]) => ({ value, label }));

export default function ManageLedgerAccount({ id, isOpen, onClose }: ManageLedgerAccountProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [isSystem, setIsSystem] = useState(false);

  const getAllAccounts = useGetAllLedgerAccounts({ showAllRecords: true });
  const createLedgerAccount = useCreateLedgerAccount();
  const updateLedgerAccount = useUpdateLedgerAccount();
  const getLedgerAccountResponse = useGetLedgerAccountById(id ?? 0, isEdit);

  const form = useForm<LedgerAccountModel>({
    resolver: zodResolver(ledgerAccountFields),
    defaultValues: {
      code: '',
      name: '',
      category: undefined,
      subType: AccountSubTypeEnum.Other,
      parentId: null,
      description: '',
      isActive: true,
      status: StatusValues.Published,
      displayOrder: undefined,
    },
  });

  const {
    reset,
    watch,
    formState: { isDirty },
  } = form;

  const selectedCategory = watch('category');

  const fillLedgerAccountDetails = (data: LedgerAccountDto) => {
    setIsSystem(data.isSystem);
    reset({
      code: data.code,
      name: data.name,
      category: data.category,
      subType: data.subType,
      parentId: data.parentId ?? null,
      description: data.description ?? '',
      isActive: data.isActive,
      status: data.status,
      displayOrder: data.displayOrder ?? undefined,
    });
  };

  // Fill once per mount: without the latch a window-focus refetch would overwrite whatever
  // the user has typed since the dialog opened.
  const filledRef = useRef(false);
  useEffect(() => {
    if (!filledRef.current && getLedgerAccountResponse.status === 'success' && getLedgerAccountResponse.data?.data.data) {
      filledRef.current = true;
      fillLedgerAccountDetails(getLedgerAccountResponse.data.data.data);
    }
  }, [getLedgerAccountResponse.status, getLedgerAccountResponse.data?.data?.data]);

  const isSaving = createLedgerAccount.isPending || updateLedgerAccount.isPending;
  useUnsavedChangesWarning(isDirty && !isSaving);

  // A parent must share the child's category and cannot be the account being edited, which is
  // exactly what the API enforces - offering anything else would only produce a 400.
  const allAccounts = getAllAccounts?.data?.data?.data?.data ?? [];
  const parentOptions = [
    { value: '', label: 'None (top level)' },
    ...allAccounts
      .filter((item) => item.id !== id && (!selectedCategory || item.category === selectedCategory))
      .map((item) => ({ value: item.id, label: `${item.code} — ${item.name}` })),
  ];

  const save = async (model: LedgerAccountModel) => {
    let response;
    try {
      response = isEdit ? await updateLedgerAccount.mutateAsync({ id: id!, model }) : await createLedgerAccount.mutateAsync(model);
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

  const submit = form.handleSubmit(
    (model) => save(model),
    (errors) => {
      if (errors.parentId || errors.subType || errors.description || errors.displayOrder || errors.status) setOptionalOpen(true);
    }
  );

  const handleCancel = () => {
    if (isDirty && !isSaving) {
      setShowLeaveConfirm(true);
      return;
    }
    onClose(false);
  };

  const showSkeleton = isEdit && getLedgerAccountResponse.isLoading;
  const fetchFailed = isEdit && getLedgerAccountResponse.isError;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader className="space-y-0 border-b bg-muted/30 px-6 py-4 text-left">
            <div className="flex items-center gap-3 pr-8">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate text-base">{isEdit ? 'Edit account' : 'New account'}</DialogTitle>
                <DialogDescription className="mt-1 text-xs">
                  <kbd className="rounded border bg-background px-1 font-mono text-[10px]">Ctrl</kbd> +{' '}
                  <kbd className="rounded border bg-background px-1 font-mono text-[10px]">Enter</kbd> saves.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {showSkeleton ? (
            <div className="space-y-4 px-6 py-5" aria-busy="true" aria-label="Loading account">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : fetchFailed ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-semibold text-destructive">Could not load this account</p>
              <p className="mt-1 text-xs text-muted-foreground">It may have been deleted. Close and refresh the list.</p>
            </div>
          ) : (
            <Form {...form}>
              <form autoComplete="off" onSubmit={submit} onKeyDown={submitOnCtrlEnter(submit)} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Code *</FormLabel>
                          <CharCounter schema={ledgerAccountFields} field="code" value={field.value ?? ''} />
                        </div>
                        <FormControl>
                          <Input placeholder="e.g. 5250" autoFocus disabled={isSystem} {...field} />
                        </FormControl>
                        {isSystem && <FormDescription>A system account keeps its code so posting rules keep finding it.</FormDescription>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Name *</FormLabel>
                          <CharCounter schema={ledgerAccountFields} field="name" value={field.value ?? ''} />
                        </div>
                        <FormControl>
                          <Input placeholder="e.g. Packaging Expense" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <FormControl>
                          {isSystem ? (
                            <Input disabled value={field.value ? ACCOUNT_CATEGORY_LABELS[field.value] : ''} readOnly />
                          ) : (
                            <SelectSearch
                              buttonClass="w-full"
                              placeholder="Pick a category"
                              items={CATEGORY_OPTIONS}
                              value={field.value ?? ''}
                              containerName="ledger-account-category"
                              onChange={(value) => {
                                field.onChange(value as AccountCategory);
                                form.setValue('parentId', null, { shouldDirty: true });
                              }}
                            />
                          )}
                        </FormControl>
                        {isSystem && <FormDescription>A system account keeps its category so the trial balance stays consistent.</FormDescription>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border px-4 py-3">
                        <div className="space-y-0.5 pr-4">
                          <FormLabel>Active</FormLabel>
                          <FormDescription className="text-xs">An inactive account can still be read but takes no new postings.</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <OptionalSection title="Parent, type & more" open={optionalOpen} onOpenChange={setOptionalOpen}>
                    <FormField
                      control={form.control}
                      name="parentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parent account</FormLabel>
                          <FormControl>
                            <SelectSearch
                              buttonClass="w-full"
                              placeholder="None (top level)"
                              items={parentOptions}
                              value={field.value ?? ''}
                              containerName="ledger-account-parent"
                              onChange={(value) => field.onChange(value ? Number(value) : null)}
                            />
                          </FormControl>
                          <FormDescription>Only accounts in the same category can be a parent.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <FormControl>
                            <SelectSearch
                              buttonClass="w-full"
                              placeholder="Other"
                              items={SUB_TYPE_OPTIONS}
                              value={field.value ?? ''}
                              containerName="ledger-account-subtype"
                              onChange={(value) => field.onChange(value)}
                            />
                          </FormControl>
                          <FormDescription>Cash and Bank accounts are what the Cash Book filters to.</FormDescription>
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
                            <Textarea rows={3} className="resize-none" placeholder="What belongs in this account…" {...field} value={field.value ?? ''} />
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
                          <FormLabel>Status</FormLabel>
                          <FormControl>
                            <StatusSwitch value={field.value} onChange={field.onChange} />
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
                      {isEdit ? 'Save changes' : 'Create account'}
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
        bodyText="This account has unsaved changes. Closing now will lose them."
        noButtonText="Keep editing"
        yesButtonText="Discard"
      />
    </>
  );
}
