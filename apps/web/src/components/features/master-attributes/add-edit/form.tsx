'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { AlertTriangle, Lock, Unlock } from 'lucide-react';
import ConfirmBox from '@/components/common/confirm-box';
import { SelectSearch } from '@/components/common/select-search';
import { Badge } from '@/components/ui/badge';
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
 * One form, two homes: the Edit dialog and the inline "Add attribute" panel above the list.
 * `variant` only changes the chrome (dialog header/footer vs. a plain panel and a wider
 * two-column body); fields, validation, saving and the dirty-cancel guard are identical.
 */
export interface MasterAttributeFormProps {
  id?: number;
  variant: 'dialog' | 'inline';
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

const STATUS_OPTIONS = [
  { value: StatusValues.Published, label: 'Published', hint: 'Selectable everywhere' },
  { value: StatusValues.Draft, label: 'Draft', hint: 'Hidden until published' },
];

const DESCRIPTION_MAX = 500;

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

const MasterAttributeForm = forwardRef<MasterAttributeFormHandle, MasterAttributeFormProps>(function MasterAttributeForm({ id, variant, onClose }, ref) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;
  const isDialog = variant === 'dialog';

  const createMutation = useCreateMasterAttribute();
  const updateMutation = useUpdateMasterAttribute();
  const { data: response, isLoading: isFetching, isError: fetchFailed } = useGetMasterAttributeById(id ?? 0, isEdit);
  const getAllCategories = useGetAllCategories({ showAllRecords: true });
  const getAllBrandNames = useGetAllBrandNames({ showAllRecords: true });

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  // Once the user types in Code it stops following Name.
  const [codeTouched, setCodeTouched] = useState(false);
  // Editing the code of a saved attribute breaks every screen that selects by it, so it starts locked.
  const [codeUnlocked, setCodeUnlocked] = useState(!isEdit);
  // Set once anything was saved so a later Cancel still tells the list to refresh.
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
  const code = form.watch('code');
  const status = form.watch('status');
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

  const save = async (model: CreateMasterAttributeModel, addAnother: boolean) => {
    const result = isEdit ? await updateMutation.mutateAsync({ id: id!, model }) : await createMutation.mutateAsync(model);

    if (result && (result.status === 200 || result.status === 201)) {
      savedRef.current = true;
      toast({ variant: 'success', title: `"${model.name}" ${isEdit ? 'updated' : 'created'}` });
      if (addAnother) {
        // Keep status and scope: someone adding several attributes usually wants them to match.
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

  const handleCancel = () => {
    if (isDirty && !isSaving) {
      setShowLeaveConfirm(true);
      return;
    }
    onClose(savedRef.current);
  };

  useImperativeHandle(ref, () => ({ requestClose: handleCancel }));

  const categoryItems = getAllCategories?.data?.data?.data?.data?.map((item) => ({ value: item.id, label: item.name })) ?? [];
  const brandItems = getAllBrandNames?.data?.data?.data?.data?.map((item) => ({ value: item.id, label: item.name })) ?? [];
  const categoryName = categoryItems.find((c) => c.value === categoryId)?.label;
  const brandName = brandItems.find((b) => b.value === brandNameId)?.label;

  const previewCode = code || 'CODE';
  const showSkeleton = isEdit && isFetching;

  // Header doubles as a live preview of the card this attribute will become.
  const preview = (
    <div className="flex items-center gap-3 pr-6">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs font-bold uppercase tracking-wide text-primary"
        aria-hidden
      >
        {previewCode.slice(0, 3)}
      </div>
      <div className="min-w-0 flex-1">
        {isDialog ? (
          <DialogTitle className="truncate text-base">{isEdit ? 'Edit attribute' : 'New attribute'}</DialogTitle>
        ) : (
          <h2 className="truncate text-base font-semibold leading-none tracking-tight">{isEdit ? 'Edit attribute' : 'New attribute'}</h2>
        )}
        {isDialog ? (
          <DialogDescription className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <PreviewLine name={name} code={previewCode} status={status} />
          </DialogDescription>
        ) : (
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <PreviewLine name={name} code={previewCode} status={status} />
          </p>
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
        {isEdit ? 'Save changes' : 'Create attribute'}
      </Button>
    </div>
  );

  const basics = (
    <section className="space-y-3">
      <SectionHeading title="Basics" hint="What this attribute is called and how the code identifies it." />

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
                className="font-mono uppercase"
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
              <FormDescription className="text-xs">
                {isEdit
                  ? 'Other screens select values by this code, so it is locked.'
                  : codeTouched
                    ? 'Uppercase letters, numbers and underscores, e.g. SHOE_SIZE.'
                    : 'Generated from the name. Type here to set your own.'}
              </FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>Description</FormLabel>
              <span className={cn('text-[11px] tabular-nums text-muted-foreground', description.length > DESCRIPTION_MAX && 'text-destructive')}>
                {description.length}/{DESCRIPTION_MAX}
              </span>
            </div>
            <FormControl>
              <Textarea className="resize-none" rows={2} placeholder="What this attribute is for (optional)" {...field} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </section>
  );

  const scope = (
    <section className="space-y-3">
      <SectionHeading
        title="Scope"
        hint={
          categoryName || brandName
            ? `Only offered for ${[categoryName, brandName].filter(Boolean).join(' and ')}.`
            : 'Leave both empty and the attribute applies to every category and brand.'
        }
      />
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
                    containerName={`master-attribute-${variant}-category`}
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
                    containerName={`master-attribute-${variant}-brand`}
                    onChange={(value) => field.onChange(value ? Number(value) : undefined)}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </section>
  );

  const display = (
    <section className="space-y-3">
      <SectionHeading title="Display" hint="How values are labelled and where the attribute sorts." />
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit</FormLabel>
              <FormControl>
                <Input placeholder="kg, cm, ml" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormDescription className="text-xs">Shown after each value, e.g. 42 cm.</FormDescription>
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
              <FormDescription className="text-xs">Lower numbers appear first.</FormDescription>
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
                {STATUS_OPTIONS.map((option) => {
                  const active = field.value === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => field.onChange(option.value)}
                      className={cn(
                        'flex flex-col items-start rounded-md border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        active ? 'border-primary bg-primary/5' : 'border-input hover:bg-accent'
                      )}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <span className={cn('h-2 w-2 rounded-full', option.value === StatusValues.Published ? 'bg-green-500' : 'bg-orange-500')} />
                        {option.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{option.hint}</span>
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
      <div className="space-y-4" aria-busy="true" aria-label="Loading attribute">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  } else if (fetchFailed) {
    body = (
      <div className="py-10 text-center">
        <p className="text-sm font-semibold text-destructive">Could not load this attribute</p>
        <p className="mt-1 text-xs text-muted-foreground">It may have been deleted. Close and refresh the list.</p>
      </div>
    );
  } else {
    body = (
      <Form {...form}>
        <form autoComplete="off" onSubmit={form.handleSubmit((m) => save(m, false))} className={cn('flex flex-col', isDialog && 'min-h-0 flex-1')}>
          {isDialog ? (
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
              {basics}
              {scope}
              {display}
            </div>
          ) : (
            // The panel has the page's full width, so Basics sits beside Scope + Display.
            <div className="grid grid-cols-1 gap-6 px-5 py-5 lg:grid-cols-2 lg:gap-8">
              {basics}
              <div className="space-y-6">
                {scope}
                {display}
              </div>
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
        <DialogHeader className="space-y-0 border-b px-6 py-4 text-left">{preview}</DialogHeader>
      ) : (
        <div className="border-b px-5 py-4">{preview}</div>
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
        bodyText="You have unsaved edits. Close without saving?"
        noButtonText="Keep editing"
        yesButtonText="Discard"
      />
    </>
  );
});

export default MasterAttributeForm;

function PreviewLine({ name, code, status }: { name?: string; code: string; status?: string }) {
  return (
    <>
      <span className="truncate font-medium text-foreground">{name || 'Untitled'}</span>
      <code className="rounded bg-muted/60 px-1.5 py-0.5 font-mono font-medium uppercase">{code}</code>
      <Badge variant={status === StatusValues.Published ? 'green' : 'orange'} className="px-1.5 py-0 text-[10px]">
        {status}
      </Badge>
    </>
  );
}

function SectionHeading({ title, hint }: { title: string; hint: string }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground/80">{hint}</p>
    </div>
  );
}
