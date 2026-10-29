'use client';
import { Button } from '@/components/ui/button';
import Field from '@/components/common/field';
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

import StatusBadge from '@/components/common/status-badge';
import { useGetSupplierById } from '@/hooks/service-hooks/useSupplierService';
import { formatDate } from '@/lib/format-date';
import { Pencil, Truck } from 'lucide-react';

interface SupplierViewProps {
  id: number;
  onEdit: () => void;
  onClose: () => void;
}

// Read-only half of the supplier dialog: what is stored, nothing to type into. "Edit" hands the
// same dialog over to the form, so the data is read and changed in one place.
export default function SupplierView({ id, onEdit, onClose }: SupplierViewProps) {
  const { data, isLoading, isError } = useGetSupplierById(id, id > 0);
  const supplier = data?.data?.data;


  return (
    <>
      <DialogHeader className="border-b px-5 py-4">
        <div className="flex items-center gap-3 pr-8">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Truck className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-base">{isLoading ? 'Supplier' : (supplier?.name ?? 'Supplier')}</DialogTitle>
            <DialogDescription className="mt-1 text-xs">Everything stored against this supplier. Use Edit to change it.</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : isError || !supplier ? (
          <div className="py-10 text-center">
            <p className="text-sm font-semibold text-destructive">Could not load this supplier</p>
            <p className="mt-1 text-xs text-muted-foreground">Close this and try again.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <dl className="grid gap-x-6">
              <Field label="Name" value={supplier.name} />
              <Field label="Status" value={<StatusBadge status={supplier.status} />} />
              <Field
                label="Email"
                value={
                  supplier.email ? (
                    <a href={`mailto:${supplier.email}`} className="text-primary hover:underline">
                      {supplier.email}
                    </a>
                  ) : (
                    '—'
                  )
                }
              />
              <Field
                label="Phone"
                value={
                  supplier.phone ? (
                    <a href={`tel:${supplier.phone}`} className="text-primary hover:underline">
                      {supplier.phone}
                    </a>
                  ) : (
                    '—'
                  )
                }
              />
              <Field label="Address" value={supplier.address?.trim() ? supplier.address : '—'} />
              <Field label="Display order" value={supplier.displayOrder ?? '—'} />
              <Field label="Supplier ID" value={<span className="font-mono text-xs">{supplier.id}</span>} />
              <Field label="Added" value={formatDate(supplier.createdAt)} />
              <Field label="Last updated" value={supplier.updatedAt ? formatDate(supplier.updatedAt) : '—'} />
            </dl>
          </div>
        )}
      </div>

      <DialogFooter className="border-t px-5 py-4">
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="button" className="gap-1.5" onClick={onEdit} disabled={isLoading || isError || !supplier}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

