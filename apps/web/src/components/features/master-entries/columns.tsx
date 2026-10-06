'use client';
import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { format, formatDistanceToNow } from 'date-fns';
import { ListChecks, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MasterEntryDto } from '@/dtos/master-entry.dto';
import { StatusValues } from '@/enums/status-values.enum';
import { cn } from '@/lib/utils';
import { HEX_COLOR } from './add-edit/form';

const HEADER = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

const STATUS_TONE: Record<string, { dot: string; text: string }> = {
  [StatusValues.Published]: { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
  [StatusValues.Draft]: { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400' },
  [StatusValues.Trash]: { dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400' },
};

// "3 days ago" with the exact timestamp on hover; a dash when the column was never set.
function When({ value }: { value?: Date | string | null }) {
  if (!value) return <span className="text-muted-foreground/60">—</span>;
  const date = new Date(value);
  return (
    <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground" title={format(date, 'PPpp')}>
      {formatDistanceToNow(date, { addSuffix: true })}
    </span>
  );
}

// Table layout for the value list. Sorting is driven by the page's Sort control, not the headers.
export const useMasterEntryColumns = (editRecord: (id: number) => void, deleteRecord: (id: number) => void) =>
  useMemo<ColumnDef<MasterEntryDto>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        enableSorting: false,
        header: () => <span className={HEADER}>Value</span>,
        cell: ({ row }) => {
          const entry = row.original;
          const swatch = entry.colorHex && HEX_COLOR.test(entry.colorHex) ? entry.colorHex : null;
          const trashed = entry.status === StatusValues.Trash;
          return (
            <div className="flex items-center gap-3">
              {swatch ? (
                <span className={cn('h-10 w-10 shrink-0 rounded-lg border shadow-inner', trashed && 'grayscale')} style={{ backgroundColor: swatch }} title={swatch} />
              ) : (
                <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-[11px] font-bold uppercase text-primary', trashed && 'grayscale')} title={entry.value}>
                  {entry.value.slice(0, 3)}
                </span>
              )}
              <div className="min-w-0">
                <button type="button" onClick={() => editRecord(+entry.id)} className="block max-w-[240px] truncate text-left text-sm font-semibold hover:underline" title={entry.name}>
                  {entry.name}
                </button>
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <code className="rounded bg-muted px-1 py-0.5 font-mono font-medium">{entry.value}</code>
                  {entry.attribute?.unit && <span>{entry.attribute.unit}</span>}
                  {swatch && <span className="font-mono uppercase">{swatch}</span>}
                </p>
              </div>
            </div>
          );
        },
        meta: { sortingKey: 'name', thClassName: 'pl-4', tdClassName: 'pl-4' },
      },
      {
        id: 'attribute',
        accessorKey: 'attribute',
        enableSorting: false,
        header: () => <span className={HEADER}>Attribute</span>,
        // Deep-links back into this screen filtered to the same attribute.
        cell: ({ row }) =>
          row.original.attribute ? (
            <Link
              href={`/admin/master-entries?attributeId=${row.original.attributeId}`}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-primary/10 hover:text-primary"
              title={`Show all ${row.original.attribute.name} values`}
            >
              <ListChecks className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{row.original.attribute.name}</span>
              <code className="shrink-0 font-mono text-[10px] uppercase text-muted-foreground">{row.original.attribute.code}</code>
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground">Attribute #{row.original.attributeId}</span>
          ),
      },
      {
        id: 'status',
        accessorKey: 'status',
        enableSorting: false,
        header: () => <span className={HEADER}>Status</span>,
        cell: ({ row }) => {
          const tone = STATUS_TONE[row.original.status] ?? { dot: 'bg-muted-foreground', text: 'text-muted-foreground' };
          return (
            <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', tone.text)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
              {row.original.status}
            </span>
          );
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
          <div className="flex flex-col gap-0.5 whitespace-nowrap">
            <span className="text-xs">
              <span className="text-muted-foreground/70">Added </span>
              <When value={row.original.createdAt} />
            </span>
            <span className="text-xs">
              <span className="text-muted-foreground/70">Updated </span>
              <When value={row.original.updatedAt} />
            </span>
          </div>
        ),
        meta: { sortingKey: 'createdAt', thClassName: 'hidden md:table-cell', tdClassName: 'hidden md:table-cell' },
      },
      {
        id: 'actions',
        enableSorting: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-0.5">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => editRecord(+row.original.id)} aria-label={`Edit ${row.original.name}`} title="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteRecord(+row.original.id)} aria-label={`Delete ${row.original.name}`} title="Delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
        meta: { thClassName: 'w-24 pr-4', tdClassName: 'pr-4' },
      },
    ],
    [editRecord, deleteRecord]
  );
