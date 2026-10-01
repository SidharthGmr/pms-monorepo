'use client';
import { forwardRef, KeyboardEvent, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Check, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { BrandNameDto, brandNameFields, CreateBrandNameModel } from '@pms/types';
import { ProductImageUploader } from '@/components/common/admin-media/product-image-uploader';
import ConfirmBox from '@/components/common/confirm-box';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
 * One form, two homes: the Edit dialog and the inline "Add New Brand" panel above the list.
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

// Each status owns its colour so the selected card reads as "green = live" or "orange = hidden" at a glance.
const STATUS_OPTIONS = [
  {
    value: StatusValues.Published,
    label: 'Published',
    hint: 'Customers can see and buy products under this brand.',
    icon: Eye,
    active: 'border-green-500 bg-green-50/70 ring-2 ring-green-500/20',
    iconActive: 'bg-green-500 text-white',
    iconIdle: 'bg-green-100 text-green-700',
    check: 'bg-green-500',
  },
  {
    value: StatusValues.Draft,
    label: 'Draft',
    hint: 'Saved for later. Hidden from the store until published.',
    icon: EyeOff,
    active: 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/20',
    iconActive: 'bg-orange-500 text-white',
    iconIdle: 'bg-orange-100 text-orange-700',
    check: 'bg-orange-500',
  },
];

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
      form.handleSubmit((m) => save(m, false))();
    }
  };

  const header = (
    <div className="flex items-center gap-3 pr-8">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Sparkles className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        {isDialog ? (
          <DialogTitle className="truncate text-base">{isEdit ? 'Edit brand' : 'New brand'}</DialogTitle>
        ) : (
          <h2 className="truncate text-base font-semibold leading-none tracking-tight">{isEdit ? 'Edit brand' : 'New brand'}</h2>
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
        {isEdit ? 'Save changes' : 'Create brand'}
      </Button>
    </div>
  );

  const details = (
    <section className="space-y-3">
      {/* <SectionHeading title="Details" hint="The name customers see and where it sorts." /> */}
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
                      <span
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors',
                          active ? option.iconActive : option.iconIdle
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 pr-5">
                        <span className={cn('block text-sm font-semibold leading-tight', active ? 'text-foreground' : 'text-foreground/90')}>
                          {option.label}
                        </span>
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

  const logoSection = (
    <section className="space-y-3">
      <SectionHeading title="Logo" hint="Optional. The first image is used as the logo on cards and in the store." />
      <FormField
        control={form.control}
        name="images"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <ProductImageUploader value={field.value || []} onChange={field.onChange} />
            </FormControl>
            <FormDescription className="text-xs">A square logo on a transparent or white background looks best on the cards.</FormDescription>
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
              <Input {...field} value={field.value ?? ''} inputMode="numeric" placeholder="0" />
            </FormControl>
            <FormDescription className="text-xs">Lower numbers appear first. Leave empty for no preference.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </section>
  );

  let body: JSX.Element;
  if (showSkeleton) {
    body = (
      <div className="space-y-4 px-6 py-5" aria-busy="true" aria-label="Loading brand">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
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
        <form
          autoComplete="off"
          onSubmit={form.handleSubmit((m) => save(m, false))}
          onKeyDown={onFormKeyDown}
          className={cn('flex flex-col', isDialog && 'min-h-0 flex-1')}
        >
          {isDialog ? (
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
              {details}
              {logoSection}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 px-5 py-5 lg:grid-cols-[1fr_minmax(280px,380px)] lg:gap-8">
              {details}
              {logoSection}
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
        bodyText="This brand has unsaved changes. Closing now will lose them."
        noButtonText="Keep editing"
        yesButtonText="Discard"
      />
    </>
  );
});

export default BrandNameForm;

function SectionHeading({ title, hint }: { title: string; hint: string }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground/80">{hint}</p>
    </div>
  );
}
