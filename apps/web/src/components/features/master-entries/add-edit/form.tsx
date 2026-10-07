'use client';
import { forwardRef, KeyboardEvent, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { ChevronDown, Sparkles } from 'lucide-react';
import ConfirmBox from '@/components/common/confirm-box';
import { SelectSearch } from '@/components/common/select-search';
import StatusCards from '@/components/common/status-cards';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { StatusValues } from '@/enums/status-values.enum';
import { useCreateMasterEntry, useGetAllMasterAttributes, useGetMasterEntryById, useUpdateMasterEntry } from '@/hooks/service-hooks/useMasterEntryService';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';
import { cn } from '@/lib/utils';
import { CreateMasterEntryModel } from '@/models/master-entry.model';
import { MasterEntrySchema } from '@/schema/masterEntrySchema';
import IUnitOfService from '@/services/interfaces/IUnitOfService';

/**
 * The dialog form for an option value, structured like the brand dialog: the required fields up
 * front, everything optional folded behind one disclosure.
 */
export interface MasterEntryFormProps {
  id?: number;
  /** Pre-selects the attribute when adding from a filtered list. */
  defaultAttributeId?: number;
  onClose: (refresh: boolean) => void;
}

export interface MasterEntryFormHandle {
  requestClose: () => void;
}

export const HEX_COLOR = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const defaults = (attributeId?: number): CreateMasterEntryModel => ({
  attributeId: attributeId ?? 0,
  name: '',
  value: '',
  colorHex: '',
  status: StatusValues.Published,
  displayOrder: 0,
});

const MasterEntryForm = forwardRef<MasterEntryFormHandle, MasterEntryFormProps>(function MasterEntryForm({ id, defaultAttributeId, onClose }, ref) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;

  const createMutation = useCreateMasterEntry();
  const updateMutation = useUpdateMasterEntry();
  const { data: response, isLoading: isFetching, isError: fetchFailed } = useGetMasterEntryById(id ?? 0, isEdit);
  const { data: attributesResponse } = useGetAllMasterAttributes({ showAllRecords: true, status: StatusValues.Published });

  const attributes = useMemo(() => attributesResponse?.data?.data?.data ?? [], [attributesResponse]);
  const attributeItems = useMemo(() => attributes.map((attribute) => ({ label: `${attribute.name} (${attribute.code})`, value: attribute.id })), [attributes]);

  // savedRef is set once anything was saved so a later Cancel still tells the list to refresh.
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [optionalOpen, setOptionalOpen] = useState(false);
  const savedRef = useRef(false);
  const nameRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<CreateMasterEntryModel>({
    resolver: yupResolver(MasterEntrySchema),
    defaultValues: defaults(defaultAttributeId),
  });
  const {
    formState: { isDirty },
  } = form;

  useEffect(() => {
    if (isEdit && response?.data?.data) {
      const entry = response.data.data;
      form.reset({
        attributeId: entry.attributeId,
        name: entry.name,
        value: entry.value,
        colorHex: entry.colorHex ?? '',
        status: entry.status as string,
        displayOrder: entry.displayOrder ?? 0,
      });
    }
  }, [isEdit, response, form]);

  const attributeId = form.watch('attributeId');
  const colorHex = form.watch('colorHex') ?? '';
  const displayOrder = form.watch('displayOrder');
  const selectedAttribute = attributes.find((attribute) => attribute.id === attributeId);
  const isColorAttribute = /colou?r/i.test(selectedAttribute?.name ?? '') || /colou?r/i.test(selectedAttribute?.code ?? '');

  // A colour attribute is pointless without its swatch, so the folded section opens itself for one.
  useEffect(() => {
    if (isColorAttribute) setOptionalOpen(true);
  }, [isColorAttribute]);

  const isSaving = createMutation.isPending || updateMutation.isPending;
  useUnsavedChangesWarning(isDirty && !isSaving);

  // "Save & add another" keeps the attribute and status, since values added in a row belong to the same group.
  // An empty colour field must clear the column, not send "".
  const save = async (model: CreateMasterEntryModel, addAnother: boolean) => {
    const payload: CreateMasterEntryModel = { ...model, colorHex: model.colorHex || null };
    const result = isEdit ? await updateMutation.mutateAsync({ id: id!, model: payload }) : await createMutation.mutateAsync(payload);

    if (result && (result.status === 200 || result.status === 201)) {
      savedRef.current = true;
      toast({ variant: 'success', title: `"${model.name}" ${isEdit ? 'updated' : 'created'}` });
      if (addAnother) {
        form.reset({ ...defaults(model.attributeId), status: model.status, displayOrder: (model.displayOrder ?? 0) + 1 });
        nameRef.current?.focus();
      } else {
        onClose(true);
      }
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(result);
      toast({ variant: 'destructive', title: 'Could not save', description: <span>{error}</span> });
    }
  };

  // Two of the fields live behind the disclosure; if one of them blocks the save, it must unfold
  // so the message is visible instead of the form refusing silently.
  const submit = (addAnother: boolean) =>
    form.handleSubmit(
      (model) => save(model, addAnother),
      (errors) => {
        if (errors.colorHex || errors.displayOrder) setOptionalOpen(true);
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

  const showSkeleton = isEdit && isFetching;

  const header = (
    <div className="flex items-center gap-3 pr-8">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Sparkles className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <DialogTitle className="truncate text-base">{isEdit ? 'Edit value' : 'New value'}</DialogTitle>
        <DialogDescription className="mt-1 text-xs">
          <kbd className="rounded border bg-background px-1 font-mono text-[10px]">Ctrl</kbd> + <kbd className="rounded border bg-background px-1 font-mono text-[10px]">Enter</kbd> saves.
        </DialogDescription>
      </div>
    </div>
  );

  const footerButtons = (
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
        {isEdit ? 'Save changes' : 'Create value'}
      </Button>
    </div>
  );

  const optionalSummary = [HEX_COLOR.test(colorHex) ? colorHex : null, displayOrder != null && String(displayOrder) !== '' && displayOrder !== 0 ? `order ${displayOrder}` : null]
    .filter(Boolean)
    .join(' · ');

  const valueSection = (
    <section className="space-y-5">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Large"
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
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stored value *</FormLabel>
              <FormControl>
                <Input placeholder="e.g. L" className="h-10 font-mono" {...field} value={field.value ?? ''} />
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
    </section>
  );

  const optionalSection = (
    <section className="overflow-hidden rounded-xl border">
      <button
        type="button"
        onClick={() => setOptionalOpen((open) => !open)}
        aria-expanded={optionalOpen}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-muted/40"
      >
        {HEX_COLOR.test(colorHex) && <span className="h-4 w-4 shrink-0 rounded-full border" style={{ backgroundColor: colorHex }} aria-hidden />}
        <span className="min-w-0 flex-1 text-sm font-semibold leading-tight">Colour &amp; display order</span>
        {!optionalOpen && optionalSummary && <span className="hidden truncate text-[11px] text-muted-foreground sm:inline">{optionalSummary}</span>}
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Optional</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', optionalOpen && 'rotate-180')} />
      </button>

      {optionalOpen && (
        <div className="grid grid-cols-1 gap-4 border-t px-4 py-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="colorHex"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Colour</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <label
                      className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-md border"
                      style={{ backgroundColor: HEX_COLOR.test(colorHex) ? colorHex : undefined }}
                      title="Pick a colour"
                    >
                      <input
                        type="color"
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        value={HEX_COLOR.test(colorHex) && colorHex.length === 7 ? colorHex : '#000000'}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        aria-label="Colour picker"
                      />
                      {!HEX_COLOR.test(colorHex) && <span className="absolute inset-0 bg-[linear-gradient(135deg,transparent_45%,hsl(var(--border))_45%,hsl(var(--border))_55%,transparent_55%)]" />}
                    </label>
                    <Input placeholder="#FF0000" className="h-10 font-mono uppercase" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                  </div>
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
      )}
    </section>
  );

  let body: JSX.Element;
  if (showSkeleton) {
    body = (
      <div className="space-y-4 px-6 py-5" aria-busy="true" aria-label="Loading value">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  } else if (fetchFailed) {
    body = (
      <div className="px-6 py-10 text-center">
        <p className="text-sm font-semibold text-destructive">Could not load this value</p>
        <p className="mt-1 text-xs text-muted-foreground">It may have been deleted. Close and refresh the list.</p>
      </div>
    );
  } else {
    body = (
      <Form {...form}>
        <form autoComplete="off" onSubmit={submit(false)} onKeyDown={onFormKeyDown} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {valueSection}
            {optionalSection}
          </div>

          <DialogFooter className="gap-2 border-t bg-muted/30 px-6 py-3 sm:justify-between">
            <p className={cn('hidden items-center gap-1.5 text-xs sm:flex', isDirty ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground')}>
              {isDirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
              {isDirty ? 'Unsaved changes' : 'No changes yet'}
            </p>
            {footerButtons}
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
        bodyText="This value has unsaved changes. Closing now will lose them."
        noButtonText="Keep editing"
        yesButtonText="Discard"
      />
    </>
  );
});

export default MasterEntryForm;
