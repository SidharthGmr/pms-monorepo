'use client';
import { forwardRef, KeyboardEvent, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { BrandNameDto, brandNameFields, CreateBrandNameModel } from '@pms/types';
import { ProductImageUploader } from '@/components/common/admin-media/product-image-uploader';
import StatusCards from '@/components/common/status-cards';
import ConfirmBox from '@/components/common/confirm-box';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { StatusValues } from '@/enums/status-values.enum';
import { useCreateBrandName, useGetBrandNameById, useUpdateBrandName } from '@/hooks/service-hooks/useBrandNameService';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';
import { cn } from '@/lib/utils';
import { zodResolver } from '@/lib/zod-resolver';
import IUnitOfService from '@/services/interfaces/IUnitOfService';

/**
 * One form, two homes: the Edit dialog and the inline "Add brand" panel above the list.
 * `variant` only changes the chrome; fields, validation, saving and the dirty-cancel guard are identical.
 */
export interface BrandNameFormProps {
  id?: number;
  variant: 'dialog' | 'inline';
  onClose: (refresh: boolean) => void;
}

export interface BrandNameFormHandle {
  requestClose: () => void;
}

const DEFAULT_VALUES: CreateBrandNameModel = {
  name: '',
  images: [],
  status: StatusValues.Draft,
  displayOrder: null,
};

const NAME_MAX = 100;

const BrandNameForm = forwardRef<BrandNameFormHandle, BrandNameFormProps>(function BrandNameForm({ id, variant, onClose }, ref) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;
  const isDialog = variant === 'dialog';

  const createMutation = useCreateBrandName();
  const updateMutation = useUpdateBrandName();
  const getBrandNameResponse = useGetBrandNameById(id ?? 0, isEdit);

  // savedRef is set once anything was saved so a later Cancel still tells the list to refresh.
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [optionalOpen, setOptionalOpen] = useState(false);
  const savedRef = useRef(false);
  const nameRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<CreateBrandNameModel>({
    resolver: zodResolver(brandNameFields),
    defaultValues: DEFAULT_VALUES,
  });
  const {
    reset,
    formState: { isDirty },
  } = form;

  const fillBrandDetails = (data: BrandNameDto) => {
    reset({
      name: data.name,
      images: data.images ?? [],
      status: data.status,
      displayOrder: data.displayOrder ?? null,
    });
  };

  useEffect(() => {
    if (getBrandNameResponse.status === 'success' && getBrandNameResponse.data?.data.data) {
      fillBrandDetails(getBrandNameResponse.data.data.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getBrandNameResponse.status, getBrandNameResponse.data?.data?.data]);

  const name = form.watch('name') ?? '';
  const images = form.watch('images') ?? [];
  const displayOrder = form.watch('displayOrder');

  const isSaving = createMutation.isPending || updateMutation.isPending;
  useUnsavedChangesWarning(isDirty && !isSaving);

  // "Save & add another" keeps the status, since brands added in a row usually share it.
  const save = async (model: CreateBrandNameModel, addAnother: boolean) => {
    const response = isEdit ? await updateMutation.mutateAsync({ id: id!, model }) : await createMutation.mutateAsync(model);

    if (response && (response.status === 200 || response.status === 201) && response.data.data) {
      savedRef.current = true;
      toast({ variant: 'success', title: `"${response.data.data.name}" ${isEdit ? 'updated' : 'created'}` });
      if (addAnother) {
        reset({ ...DEFAULT_VALUES, status: model.status });
        nameRef.current?.focus();
      } else {
        reset(model);
        onClose(true);
      }
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Could not save', description: <span>{error}</span> });
    }
  };

  // Two of the fields live behind the disclosure; if one of them blocks the save, it must unfold
  // so the message is visible instead of the form refusing silently.
  const submit = (addAnother: boolean) =>
    form.handleSubmit(
      (model) => save(model, addAnother),
      (errors) => {
        if (errors.images || errors.displayOrder) setOptionalOpen(true);
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

  const showSkeleton = isEdit && getBrandNameResponse.isLoading;
  const fetchFailed = isEdit && getBrandNameResponse.isError;

  // Ctrl/Cmd+Enter saves from anywhere in the form, so a keyboard user never has to reach the footer.
  const onFormKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      submit(false)();
    }
  };

  const title = isEdit ? 'Edit brand' : 'New brand';
  const subtitle = (
    <>
      <kbd className="rounded border bg-background px-1 font-mono text-[10px]">Ctrl</kbd> + <kbd className="rounded border bg-background px-1 font-mono text-[10px]">Enter</kbd> saves.
    </>
  );

  const header = (
    <div className="flex items-center gap-3 pr-8">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Sparkles className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        {isDialog ? <DialogTitle className="truncate text-base">{title}</DialogTitle> : <h2 className="truncate text-base font-semibold leading-none tracking-tight">{title}</h2>}
        {isDialog ? <DialogDescription className="mt-1 text-xs">{subtitle}</DialogDescription> : <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
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
        {isEdit ? 'Save changes' : 'Create brand'}
      </Button>
    </div>
  );

  const details = (
    <section className="space-y-5">

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>Brand name *</FormLabel>
              <span className={cn('text-[11px] tabular-nums text-muted-foreground', name.length > NAME_MAX && 'text-destructive')}>
                {name.length}/{NAME_MAX}
              </span>
            </div>
            <FormControl>
              <Input
                placeholder="e.g. Nike, Adidas"
                autoFocus
                className="h-10"
                {...field}
                ref={(el) => {
                  field.ref(el);
                  nameRef.current = el;
                }}
              />
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

    </section>
  );

  // Everything the API accepts but does not require, folded away until it is wanted. The summary
  // keeps the stored values visible while the section is closed.
  const optionalSummary = [
    images.length > 0 ? `${images.length} ${images.length === 1 ? 'image' : 'images'}` : null,
    displayOrder != null && String(displayOrder) !== '' ? `order ${displayOrder}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const optionalSection = (
    <section className="overflow-hidden rounded-xl border">
      <button
        type="button"
        onClick={() => setOptionalOpen((open) => !open)}
        aria-expanded={optionalOpen}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-muted/40"
      >
        <span className="min-w-0 flex-1 text-sm font-semibold leading-tight">Logo &amp; display order</span>
        {!optionalOpen && optionalSummary && <span className="hidden truncate text-[11px] text-muted-foreground sm:inline">{optionalSummary}</span>}
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Optional</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', optionalOpen && 'rotate-180')} />
      </button>

      {optionalOpen && (
        <div className="space-y-5 border-t px-4 py-4">
          <FormField
            control={form.control}
            name="images"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Logo</FormLabel>
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
                  <Input {...field} value={field.value ?? ''} inputMode="numeric" placeholder="0" className="h-10 sm:max-w-[160px]" />
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
      <div className="grid grid-cols-1 gap-6 px-5 py-5 lg:grid-cols-[1fr_minmax(280px,360px)]" aria-busy="true" aria-label="Loading brand">
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  } else if (fetchFailed) {
    body = (
      <div className="px-6 py-10 text-center">
        <p className="text-sm font-semibold text-destructive">Could not load this brand</p>
        <p className="mt-1 text-xs text-muted-foreground">It may have been deleted. Close and refresh the list.</p>
      </div>
    );
  } else {
    body = (
      <Form {...form}>
        <form autoComplete="off" onSubmit={submit(false)} onKeyDown={onFormKeyDown} className={cn('flex flex-col', isDialog && 'min-h-0 flex-1')}>
          {isDialog ? (
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
              {details}
              {optionalSection}
            </div>
          ) : (
            <div className="max-w-2xl space-y-6 px-5 py-5">
              {details}
              {optionalSection}
            </div>
          )}

          {isDialog ? (
            <DialogFooter className="gap-2 border-t bg-muted/30 px-6 py-3 sm:justify-between">
              <DirtyNote dirty={isDirty} />
              {footerButtons}
            </DialogFooter>
          ) : (
            <div className="flex flex-col-reverse gap-2 border-t bg-muted/30 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <DirtyNote dirty={isDirty} />
              {footerButtons}
            </div>
          )}
        </form>
      </Form>
    );
  }

  return (
    <>
      {isDialog ? <DialogHeader className="space-y-0 border-b bg-muted/30 px-6 py-4 text-left">{header}</DialogHeader> : <div className="border-b bg-muted/30 px-5 py-4">{header}</div>}

      {body}

      <ConfirmBox
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onSubmit={() => {
          setShowLeaveConfirm(false);
          onClose(savedRef.current);
        }}
        heading="Discard changes?"
        bodyText="This brand has unsaved changes. Closing now will lose them."
        noButtonText="Keep editing"
        yesButtonText="Discard"
      />
    </>
  );
});

export default BrandNameForm;

function DirtyNote({ dirty }: { dirty: boolean }) {
  return (
    <p className={cn('hidden items-center gap-1.5 text-xs sm:flex', dirty ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground')}>
      {dirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
      {dirty ? 'Unsaved changes' : 'No changes yet'}
    </p>
  );
}

