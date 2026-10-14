'use client';
import RecordTimestamps from '@/components/common/record-timestamps';
import StatusBadge from '@/components/common/status-badge';
import { Button } from '@/components/ui/button';
import { CmsPageListItemDto } from '@pms/types';
import { ColumnDef } from '@tanstack/react-table';
import { ExternalLink, EyeOff, FileText, Lock, MapPinOff, Pencil, ShieldQuestion, Trash2 } from 'lucide-react';
import { useMemo } from 'react';

const HEADER = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

// Table layout for the pages list. Sorting is driven by the toolbar's Sort control, not the headers.
export const useCmsPageColumns = (editRecord: (id: number) => void, deleteRecord: (id: number) => void) =>
  useMemo<ColumnDef<CmsPageListItemDto>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        enableSorting: false,
        header: () => <span className={HEADER}>Page</span>,
        cell: ({ row }) => {
          const page = row.original;
          return (
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40">
                {page.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={page.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground/40" />
                )}
              </span>
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => editRecord(page.id)}
                  className="block max-w-[260px] truncate text-left text-sm font-semibold hover:underline"
                  title={page.name}
                >
                  {page.name}
                </button>
                <p className="truncate text-[11px] text-muted-foreground">/{page.slug}</p>
              </div>
            </div>
          );
        },
        meta: { sortingKey: 'name', thClassName: 'pl-4', tdClassName: 'pl-4' },
      },
      {
        id: 'status',
        accessorKey: 'status',
        enableSorting: false,
        header: () => <span className={HEADER}>Status</span>,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        meta: { sortingKey: 'status' },
      },
      {
        id: 'access',
        enableSorting: false,
        header: () => <span className={HEADER}>Visibility</span>,
        cell: ({ row }) => {
          const page = row.original;
          const flags = [
            page.passwordEnabled && { icon: Lock, label: 'Password protected' },
            page.conditionEnabled && { icon: ShieldQuestion, label: 'Unlocked by a form submission' },
            page.hideFromSearch && { icon: EyeOff, label: 'Hidden from search engines' },
            page.excludeFromSitemap && { icon: MapPinOff, label: 'Excluded from sitemap' },
          ].filter((flag): flag is { icon: typeof Lock; label: string } => !!flag);
          if (flags.length === 0) return <span className="text-xs text-muted-foreground">Public</span>;
          return (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              {flags.map(({ icon: Icon, label }) => (
                <Icon key={label} className="h-3.5 w-3.5" aria-label={label}>
                  <title>{label}</title>
                </Icon>
              ))}
            </div>
          );
        },
        meta: { thClassName: 'hidden sm:table-cell', tdClassName: 'hidden sm:table-cell' },
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        enableSorting: false,
        header: () => <span className={HEADER}>Added / Updated</span>,
        cell: ({ row }) => <RecordTimestamps createdAt={row.original.createdAt} updatedAt={row.original.updatedAt} />,
        meta: { sortingKey: 'createdAt', thClassName: 'hidden md:table-cell', tdClassName: 'hidden md:table-cell' },
      },
      {
        id: 'actions',
        enableSorting: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-0.5">
            <Button
              asChild
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              aria-label={`Open /${row.original.slug}`}
              title="Open live page"
            >
              <a href={`/${row.original.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => editRecord(row.original.id)}
              aria-label={`Edit ${row.original.name}`}
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => deleteRecord(row.original.id)}
              aria-label={`Delete ${row.original.name}`}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
        meta: { thClassName: 'w-32 pr-4', tdClassName: 'pr-4' },
      },
    ],
    [editRecord, deleteRecord]
  );
