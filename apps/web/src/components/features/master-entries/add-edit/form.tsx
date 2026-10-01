'use client';
import { forwardRef, KeyboardEvent, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Check, Eye, EyeOff, Sparkles } from 'lucide-react';
import ConfirmBox from '@/components/common/confirm-box';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
 * One form, two homes: the Edit dialog and the inline "Add Value" panel above the list.
 * `variant` only changes the chrome; fields, validation, saving and the dirty-cancel guard are identical.
 */
export interface MasterEntryFormProps {
  id?: number;
  /** Pre-selects the attribute when adding from a filtered list. */
  defaultAttributeId?: number;
  variant: 'dialog' | 'inline';
  onClose: (refresh: boolean) => void;
}

export interface MasterEntryFormHandle {
  requestClose: () => void;
}

export const HEX_COLOR = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const STATUS_OPTIONS = [
  {
    value: StatusValues.Published,
    label: 'Published',
    hint: 'Offered in dropdowns that use this attribute.',
    icon: Eye,
    active: 'border-green-500 bg-green-50/70 ring-2 ring-green-500/20',
    iconActive: 'bg-green-500 text-white',
    iconIdle: 'bg-green-100 text-green-700',
    check: 'bg-green-500',
  },
  {
    value: StatusValues.Draft,
    label: 'Draft',
    hint: 'Saved for later. Hidden from dropdowns until published.',
    icon: EyeOff,
    active: 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/20',
    iconActive: 'bg-orange-500 text-white',
    iconIdle: 'bg-orange-100 text-orange-700',
    check: 'bg-orange-500',
  },
];

const NAME_MAX = 100;

const defaults = (attributeId?: number): CreateMasterEntryModel => ({
  attributeId: attributeId ?? 0,
  name: '',
  value: '',
  colorHex: '',
  status: StatusValues.Published,
  displayOrder: 0,
});

const MasterEntryForm = forwardRef<MasterEntryFormHandle, MasterEntryFormProps>(function MasterEntryForm({ id, defaultAttributeId, variant, onClose }, ref) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;
  const isDialog = variant === 'dialog';

  const createMutation = useCreateMasterEntry();
  const updateMutation = useUpdateMasterEntry();
  const { data: response, isLoading: isFetching, isError: fetchFailed } = useGetMasterEntryById(id ?? 0, isEdit);
  const { data: attributesResponse } = useGetAllMasterAttributes({ showAllRecords: true, status: StatusValues.Published });

  const attributes = useMemo(() => attributesResponse?.data?.data?.data ?? [], [attributesResponse]);
  const attributeItems = useMemo(() => attributes.map((attribute) => ({ label: `${attribute.name} (${attribute.code})`, value: attribute.id })), [attributes]);

  // savedRef is set once anything was saved so a later Cancel still tells the list to refresh.
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
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

  const name = form.watch('name') ?? '';
  const attributeId = form.watch('attributeId');
  const colorHex = form.watch('colorHex') ?? '';
  const selectedAttribute = attributes.find((attribute) => attribute.id === attributeId);
  const isColorAttribute = /colou?r/i.test(selectedAttribute?.name ?? '') || /colou?r/i.test(selectedAttribute?.code ?? '');

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
      form.handleSubmit((m) => save(m, false))();
    }
  };

  const showSkeleton = isEdit && isFetching;

  const header = (
    <div className="flex items-center gap-3 pr-8">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Sparkles className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        {isDialog ? (
          <DialogTitle className="truncate text-base">{isEdit ? 'Edit value' : 'New value'}</DialogTitle>
        ) : (
          <h2 className="truncate text-base font-semibold leading-none tracking-tight">{isEdit ? 'Edit value' : 'New value'}</h2>
        )}
        {isDialog ? (
          <DialogDescription className="mt-1 text-xs">Fields marked * are required. Press Ctrl+Enter to save.</DialogDescription>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">Fields marked * are required. Press Ctrl+Enter to save.</p>
        )}
      </div>
    </div>
  );

  const footerButtons = (
    <div className="flex flex-col-reverse gap-2 sm:flex-row">
      <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
        Cancel
      </Button>
      {!isEdit && (
        <Button type="button" variant="secondary" loading={isSaving} onClick={form.handleSubmit((m) => save(m, true))}>
          Save &amp; add another
        </Button>
      )}
      <Button type="submit" loading={isSaving}>
        {isEdit ? 'Save changes' : 'Create value'}
      </Button>
    </div>
  );

  const valueSection = (
    <section className="space-y-3">
      <SectionHeading title="Value" hint="Which attribute this belongs to, what people see, and what gets stored." />
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
                  containerName={`master-entry-${variant}-attribute`}
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
              <div className="flex items-center justify-between">
                <FormLabel>Label *</FormLabel>
                <span className={cn('text-[11px] tabular-nums text-muted-foreground', name.length > NAME_MAX && 'text-destructive')}>
                  {name.length}/{NAME_MAX}
                </span>
              </div>
              <FormControl>
                <Input
                  placeholder="e.g. Large"
                  autoFocus
                  {...field}
                  ref={(el) => {
                    field.ref(el);
                    nameRef.current = el;
                  }}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription className="text-xs">Shown in dropdowns.</FormDescription>
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
                <Input placeholder="e.g. L" className="font-mono" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormDescription className="text-xs">
                Saved on records{selectedAttribute?.unit ? ` in ${selectedAttribute.unit}` : ''}. Unique within the attribute.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </section>
  );

  const displaySection = (
    <section className="space-y-3">
      <SectionHeading title="Display" hint="Optional colour swatch, sort position, and whether it is live." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="colorHex"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Colour{isColorAttribute ? '' : ' (optional)'}</FormLabel>
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
                  <Input placeholder="#FF0000" className="font-mono uppercase" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                </div>
              </FormControl>
              <FormDescription className="text-xs">Shown as a swatch next to the value, e.g. for colours.</FormDescription>
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
                <Input type="number" inputMode="numeric" min={0} placeholder="0" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : +e.target.value)} />
              </FormControl>
              <FormDescription className="text-xs">Lower numbers appear first in dropdowns.</FormDescription>
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
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Status">
                {STATUS_OPTIONS.map(({ icon: Icon, ...option }) => {
                  const active = field.value === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => field.onChange(option.value)}
                      className={cn(
                        'group relative flex items-start gap-3 rounded-lg border bg-background p-3 text-left transition-all duration-150',
                        'hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        active ? option.active : 'border-input hover:border-muted-foreground/40'
                      )}
                    >
                      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors', active ? option.iconActive : option.iconIdle)}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 pr-5">
                        <span className="block text-sm font-semibold leading-tight">{option.label}</span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{option.hint}</span>
                      </span>
                      <span
                        aria-hidden
                        className={cn(
                          'absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full text-white transition-all duration-150',
                          active ? cn(option.check, 'scale-100 opacity-100') : 'scale-50 opacity-0'
                        )}
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
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
        <form autoComplete="off" onSubmit={form.handleSubmit((m) => save(m, false))} onKeyDown={onFormKeyDown} className={cn('flex flex-col', isDialog && 'min-h-0 flex-1')}>
          {isDialog ? (
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
              {valueSection}
              {displaySection}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 px-5 py-5 lg:grid-cols-2 lg:gap-8">
              {valueSection}
              {displaySection}
            </div>
          )}

          {isDialog ? (
            <DialogFooter className="gap-2 border-t bg-muted/30 px-6 py-3 sm:justify-between">
              <p className="hidden self-center text-xs text-muted-foreground sm:block">{isDirty ? 'Unsaved changes' : ' '}</p>
              {footerButtons}
            </DialogFooter>
          ) : (
            <div className="flex flex-col-reverse gap-2 border-t bg-muted/30 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">{isDirty ? 'Unsaved changes' : ' '}</p>
              {footerButtons}
            </div>
          )}
        </form>
      </Form>
    );
  }

  return (
    <>
      {isDialog ? (
        <DialogHeader className="space-y-0 border-b bg-muted/30 px-6 py-4 text-left">{header}</DialogHeader>
      ) : (
        <div className="border-b bg-muted/30 px-5 py-4">{header}</div>
      )}

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

function SectionHeading({ title, hint }: { title: string; hint: string }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground/80">{hint}</p>
    </div>
  );
}
