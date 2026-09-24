# Add/edit Dialog template

The `apps/web` half of a resource. Copy this file, swap `BrandName`/`brandName`/`brand-names`
for your entity, delete the blocks you do not need (images, parent select).

`ManageBrandName` is the closest thing in the repo to this, but read the **Known deviations**
at the bottom before copying it directly — it still carries several bugs this template fixes.

---

## The component

`apps/web/src/components/features/<kebab-plural>/add-edit/index.tsx`

```tsx
'use client';
import ConfirmBox from '@/components/common/confirm-box';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import StatusData from '@/data/status.data';
import { StatusValues } from '@/enums/status-values.enum';
import { useCreateBrandName, useGetBrandNameById, useUpdateBrandName } from '@/hooks/service-hooks/useBrandNameService';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';
import { zodResolver } from '@/lib/zod-resolver';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { brandNameFields, CreateBrandNameModel } from '@pms/types';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

interface ManageBrandNameProps {
  /** Absent when adding - the listing wrapper opens this dialog with no id. */
  id?: number;
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

export default function ManageBrandName({ id, isOpen, onClose }: ManageBrandNameProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;

  const [showLeaveConfirm, setShowLeaveConfirm] = useState<boolean>(false);

  const createMutation = useCreateBrandName();
  const updateMutation = useUpdateBrandName();
  const getResponse = useGetBrandNameById(id ?? 0, isEdit);

  const form = useForm<CreateBrandNameModel>({
    // The FLAT field schema, never the `body` wrapped one the API route uses.
    resolver: zodResolver(brandNameFields),
    defaultValues: {
      name: '',
      images: [],
      status: StatusValues.Draft,
      displayOrder: null,
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isDirty },
  } = form;

  useUnsavedChangesWarning(isDirty);

  useEffect(() => {
    const row = getResponse.data?.data?.data;
    if (isEdit && row) {
      reset({
        name: row.name,
        images: row.images ?? [],
        status: row.status,
        displayOrder: row.displayOrder ?? null,
      });
    }
  }, [isEdit, getResponse.data?.data?.data, reset]);

  const submitData = async (model: CreateBrandNameModel) => {
    // Branch on `isEdit`, never on a flag set by the fetch.
    const response = isEdit ? await updateMutation.mutateAsync({ id: id!, model }) : await createMutation.mutateAsync(model);

    if (response && (response.status === 200 || response.status === 201)) {
      toast({ variant: 'success', title: `Brand name ${isEdit ? 'updated' : 'created'} successfully` });
      onClose(true);
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleCancel = () => {
    if (isDirty) {
      setShowLeaveConfirm(true);
      return;
    }
    onClose(false); // nothing changed - do not make the list refetch
  };

  if (isEdit && getResponse.isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={() => onClose(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Brand Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-4" aria-busy="true" aria-label="Loading brand name">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isEdit && getResponse.isError) {
    return (
      <Dialog open={isOpen} onOpenChange={() => onClose(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Brand Name</DialogTitle>
          </DialogHeader>
          <Card>
            <CardTitle variant="sm">Could not load this brand name</CardTitle>
            <CardDescription>Close this dialog and try again.</CardDescription>
          </Card>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit' : 'Add'} Brand Name</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form autoComplete="off" onSubmit={handleSubmit(submitData)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Nike, Adidas" {...field} value={field.value ?? ''} />
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
                      <div className="flex">
                        <SelectSearch
                          placeholder="Select Status*"
                          buttonClass="w-full"
                          disableSearch
                          items={StatusData}
                          value={field.value}
                          valueType="string"
                          containerName="brand-name-status"
                          onChange={(value) => field.onChange(value)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSaving}>
                  {isEdit ? 'Update' : 'Add'} Brand Name
                </Button>
              </div>
            </form>
          </Form>
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
        bodyText="This form has unsaved changes. Closing now will lose them."
        noButtonText="Keep editing"
        yesButtonText="Discard"
      />
    </>
  );
}
```

---

## Optional field blocks

**Images** — `ProductImageUploader` handles upload + Cloudinary signing; the field is a `string[]`.

```tsx
<FormField
  control={form.control}
  name="images"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Brand logo</FormLabel>
      <FormControl>
        <ProductImageUploader value={field.value || []} onChange={field.onChange} />
      </FormControl>
      <CardDescription className="text-xs text-muted-foreground">Optional. The first image is used as the logo.</CardDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

**A relation select** — load the options with `showAllRecords: true`, and exclude the row being
edited when the API forbids self-reference (categories reject self-parenting):

```tsx
const getAllCategories = useGetAllCategories({ showAllRecords: true });
const parentOptions =
  getAllCategories?.data?.data?.data?.data?.filter((item) => !isEdit || item.id !== id).map((item) => ({ value: item.id, label: item.name })) ?? [];

<SelectSearch
  buttonClass="w-full"
  placeholder="Select Parent Category"
  items={parentOptions}
  value={field.value ?? ''}
  containerName="category-parent"
  onChange={(value) => field.onChange(value ? Number(value) : null)}
/>
```

**A numeric field.** Match the column, not the widget:

| Column | Validator | Input |
|---|---|---|
| `Int?` (nullable, e.g. `brandName.displayOrder`) | `z.number().int().min(0).nullable().optional()` | `onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}` |
| `Int NOT NULL @default(0)` (e.g. `category.displayOrder`) | `z.number().int().min(0).optional()` — **not** nullable | `… ? undefined : Number(…)` so the column default applies |
| Column is `Int` but you want a plain text box | `z.preprocess((v) => (v === '' \|\| v == null ? null : v), z.coerce.number().int().min(0).nullable())` | plain `<Input {...field} value={field.value ?? ''} />` |

---

## The listing side

`listing-wrapper.tsx` opens the dialog for **Add** with no `id`; `index.tsx` opens it for
**Edit** with one. Both mount it conditionally, which is why the component never needs to
reset itself on close:

```tsx
// listing-wrapper.tsx - Add
{showAddModal && <ManageBrandName isOpen={showAddModal} onClose={() => setShowAddModal(false)} />}

// index.tsx - Edit, via useModalShowHide
const { showModal, openModal, closeModal, uniqueId } = useModalShowHide();

{showModal && (
  <ManageBrandName
    id={+(uniqueId ?? 0)}
    isOpen={showModal}
    onClose={(refresh) => {
      closeModal(refresh);
      if (refresh) listResponse.refetch();
    }}
  />
)}
```

---

## Known deviations in `ManageBrandName`

Do not copy these — they are why this template exists:

1. `initialState.modalHeading: 'Add Grade'` — wrong entity, and unused (`DialogTitle` computes
   its own title).
2. Skeleton/error copy says "course": `aria-label="Loading course"`, "Could not load this
   course", "go back to the course list".
3. The skeleton is unreachable: `if (isEdit && isLoading && getbrandNameResponse.isLoading)` —
   `isLoading` is create/update *pending*, false while fetching. Drop the `isLoading` term.
4. Create-vs-update branches on `isUpdating`, which is only set after the GET resolves.
   Submitting before the fetch lands **creates a duplicate instead of updating**. Use `isEdit`.
5. `showLoader` is set true and never reset, so `useUnsavedChangesWarning(isDirty && !showLoader)`
   is dead after the first submit. The `if (showLoader) return` guard also sits *after*
   `dispatch(SHOW_LOADER, true)` and reads stale state. Derive from the mutations instead.
6. `handleCancel` is defined but never wired — an ESLint **error**, and `next.config.mjs` sets
   `ignoreDuringBuilds: false`, so it blocks `npm run build:web`. Cancel calls `onClose(false)`
   directly, so the dirty guard never runs, and `showLeaveConfirm` has no UI behind it.
   `handleCancel` also calls `onClose(true)`, forcing a refetch after a cancel that changed nothing.
7. `useReducer(modalReducer)` and `useState` hold the same flags (`states.isUpdate`/`isUpdating`,
   `states.showLoader`/`showLoader`). Keep one. The reducer earns its place only if you need
   `refreshRequired` across several handlers.
8. `setValue` and `watch` are destructured but unused.
