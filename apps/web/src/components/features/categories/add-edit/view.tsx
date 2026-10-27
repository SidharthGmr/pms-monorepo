'use client';
import { Button } from '@/components/ui/button';
import Field from '@/components/common/field';
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

import StatusBadge from '@/components/common/status-badge';
import { useGetCategoryById } from '@/hooks/service-hooks/useCategoryService';
import { formatDate } from '@/lib/format-date';
import { FolderTree, ImageOff, Pencil } from 'lucide-react';

interface CategoryViewProps {
  id: number;
  /** Resolves the parent's name without an extra request; the list already holds it. */
  parentName?: string;
  onEdit: () => void;
  onClose: () => void;
}

// Read-only half of the category dialog: what is stored, nothing to type into. "Edit" hands the
// same dialog over to the form, so the data is read and changed in one place.
export default function CategoryView({ id, parentName, onEdit, onClose }: CategoryViewProps) {
  const { data, isLoading, isError } = useGetCategoryById(id, id > 0);
  const category = data?.data?.data;

  const image = category?.images?.[0];

  return (
    <>
      <DialogHeader className="border-b px-5 py-4">
        <div className="flex items-center gap-3 pr-8">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FolderTree className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-base">{isLoading ? 'Category' : (category?.name ?? 'Category')}</DialogTitle>
            <DialogDescription className="mt-1 text-xs">Everything stored against this category. Use Edit to change it.</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : isError || !category ? (
          <div className="py-10 text-center">
            <p className="text-sm font-semibold text-destructive">Could not load this category</p>
            <p className="mt-1 text-xs text-muted-foreground">Close this and try again.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex h-32 items-center justify-center overflow-hidden rounded-xl border bg-gradient-to-b from-muted/60 to-muted/20">
              {image ? (
                // Category images come from arbitrary CDNs; next/image would need each host in
                // `next.config.mjs` remotePatterns, so a plain <img> keeps unknown hosts working.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt={category.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground/50">
                  <ImageOff className="h-7 w-7" />
                  <span className="text-[11px]">No image uploaded</span>
                </div>
              )}
            </div>

            <dl className="grid gap-x-6">
              <Field label="Name" value={category.name} />
              <Field label="Status" value={<StatusBadge status={category.status} />} />
              <Field label="Parent category" value={category.parentId == null ? 'None (top level)' : (parentName ?? `#${category.parentId}`)} />
              <Field label="Description" value={category.description?.trim() ? category.description : '—'} />
              <Field label="Display order" value={category.displayOrder ?? '—'} />
              <Field label="Category ID" value={<span className="font-mono text-xs">{category.id}</span>} />
              <Field label="Images" value={category.images?.length ? `${category.images.length} uploaded` : 'None'} />
              <Field label="Added" value={formatDate(category.createdAt)} />
              <Field label="Last updated" value={category.updatedAt ? formatDate(category.updatedAt) : '—'} />
            </dl>
          </div>
        )}
      </div>

      <DialogFooter className="border-t px-5 py-4">
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="button" className="gap-1.5" onClick={onEdit} disabled={isLoading || isError || !category}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

