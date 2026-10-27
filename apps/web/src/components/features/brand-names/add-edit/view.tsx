'use client';
import { Button } from '@/components/ui/button';
import Field from '@/components/common/field';
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

import { useGetBrandNameById } from '@/hooks/service-hooks/useBrandNameService';
import { formatDate } from '@/lib/format-date';
import { ImageOff, Pencil, Sparkles } from 'lucide-react';
import { BrandNameDto } from '@pms/types';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/common/status-badge';

interface BrandNameViewProps {
  id: number;
  onEdit: () => void;
  onClose: () => void;
}

export default function BrandNameView({ id, onEdit, onClose }: BrandNameViewProps) {
  const { data, isLoading, isError } = useGetBrandNameById(id, id > 0);
  const brand = data?.data?.data as BrandNameDto;
  const logo = brand?.images?.[0];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }
  if (isError || !brand) {
    return (
      <Card>
        <CardTitle variant="sm">Could not load this brand</CardTitle>
        <CardDescription>It may have been deleted. Close and refresh the list.</CardDescription>
      </Card>
    );
  }

  return (
    <>
      <DialogHeader className="border-b px-5 py-4">
        <div className="flex items-center gap-3 pr-8">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-base">{isLoading ? 'Brand' : (brand?.name ?? 'Brand')}</DialogTitle>
            <DialogDescription className="mt-1 text-xs">Everything stored against this brand. Use Edit to change it.</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="space-y-5">
          <div className="flex h-32 items-center justify-center rounded-xl border bg-gradient-to-b from-muted/60 to-muted/20 p-4">
            {logo ? (
              <img src={logo} alt={brand.name} className="max-h-full max-w-[70%] object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground/50">
                <ImageOff className="h-7 w-7" />
                <span className="text-[11px]">No logo uploaded</span>
              </div>
            )}
          </div>

          <dl className="grid gap-x-6">
            <Field label="Name" value={brand.name} />
            <Field label="Status" value={<StatusBadge status={brand.status} />} />
            <Field label="ID" value={<span className="font-mono text-xs">{brand.id}</span>} />
            <Field label="Display order" value={brand.displayOrder ?? '—'} />
            {brand.updatedAt && <Field label="Updated At" value={formatDate(brand.updatedAt)} />}
            <Field label="Created At" value={formatDate(brand.createdAt)} />
          </dl>
        </div>
      </div>

      <DialogFooter className="border-t px-5 py-4">
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="button" className="gap-1.5" onClick={onEdit} disabled={isLoading || isError || !brand}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
