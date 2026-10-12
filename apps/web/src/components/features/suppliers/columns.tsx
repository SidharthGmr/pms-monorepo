'use client';
import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Mail, MapPin, Pencil, Phone, Trash2 } from 'lucide-react';
import RecordTimestamps from '@/components/common/record-timestamps';
import StatusBadge from '@/components/common/status-badge';
import { Button } from '@/components/ui/button';
import { SupplierDto } from '@/dtos/supplier.dto';
import { cn } from '@/lib/utils';

const HEADER = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

const TONES = [
  'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
];

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?';

// Table layout for the supplier list. Sorting is driven by the page's Sort control, not the headers.
export const useSupplierColumns = (editRecord: (id: number) => void, deleteRecord: (id: number) => void, viewRecord?: (id: number) => void) =>
  useMemo<ColumnDef<SupplierDto>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        enableSorting: false,
        header: () => <span className={HEADER}>Supplier</span>,
        cell: ({ row }) => {
          const supplier = row.original;
          const tone = TONES[supplier.name.length % TONES.length];
          return (
            <div className="flex items-center gap-3">
              <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold', tone)}>{initials(supplier.name)}</span>
              <div className="min-w-0">
                <button type="button" onClick={() => (viewRecord ?? editRecord)(supplier.id)} className="block max-w-[260px] truncate text-left text-sm font-semibold hover:underline" title={supplier.name}>
                  {supplier.name}
                </button>
                <p className="truncate text-[11px] text-muted-foreground">{supplier.contactPerson ? `Contact: ${supplier.contactPerson}` : 'No contact person'}</p>
              </div>
            </div>
          );
        },
        meta: { sortingKey: 'name', thClassName: 'pl-4', tdClassName: 'pl-4' },
      },
      {
        id: 'contact',
        enableSorting: false,
        header: () => <span className={HEADER}>Contact</span>,
        cell: ({ row }) => {
          const { email, phone } = row.original;
          if (!email && !phone) return <span className="text-xs text-muted-foreground/60">—</span>;
          return (
            <div className="flex flex-col gap-0.5 text-xs">
              {email && (
                <a href={`mailto:${email}`} className="inline-flex max-w-[240px] items-center gap-1.5 truncate text-foreground/80 hover:text-primary hover:underline">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{email}</span>
                </a>
              )}
              {phone && (
                <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 text-foreground/80 hover:text-primary hover:underline">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  {phone}
                </a>
              )}
            </div>
          );
        },
      },
      {
        id: 'address',
        accessorKey: 'address',
        enableSorting: false,
        header: () => <span className={HEADER}>Address</span>,
        cell: ({ row }) =>
          row.original.address ? (
            <span className="inline-flex max-w-[260px] items-start gap-1.5 text-xs text-muted-foreground" title={row.original.address}>
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-2">{row.original.address}</span>
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/60">—</span>
          ),
        meta: { thClassName: 'hidden lg:table-cell', tdClassName: 'hidden lg:table-cell' },
      },
      {
        id: 'status',
        accessorKey: 'status',
        enableSorting: false,
        header: () => <span className={HEADER}>Status</span>,
        cell: ({ row }) => {
          return <StatusBadge status={row.original.status} />;
        },
        meta: { sortingKey: 'status' },
      },
      {
        id: 'displayOrder',
        accessorKey: 'displayOrder',
        enableSorting: false,
        header: () => <span className={HEADER}>Order</span>,
        cell: ({ row }) => (
          <span className="inline-flex min-w-7 justify-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums">{row.original.displayOrder ?? '—'}</span>
        ),
        meta: { sortingKey: 'displayOrder', thClassName: 'text-center', tdClassName: 'text-center' },
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        enableSorting: false,
        header: () => <span className={HEADER}>Added / Updated</span>,
        cell: ({ row }) => (
          <RecordTimestamps createdAt={row.original.createdAt} updatedAt={row.original.updatedAt} />
        ),
        meta: { sortingKey: 'createdAt', thClassName: 'hidden md:table-cell', tdClassName: 'hidden md:table-cell' },
      },
      {
        id: 'actions',
        enableSorting: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-0.5">
            {viewRecord && (
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => viewRecord(row.original.id)} aria-label={`View ${row.original.name}`} title="View">
                <Eye className="h-4 w-4" />
              </Button>
            )}
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => editRecord(row.original.id)} aria-label={`Edit ${row.original.name}`} title="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteRecord(row.original.id)} aria-label={`Delete ${row.original.name}`} title="Delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
        meta: { thClassName: 'w-32 pr-4', tdClassName: 'pr-4' },
      },
    ],
    [editRecord, deleteRecord, viewRecord]
  );
