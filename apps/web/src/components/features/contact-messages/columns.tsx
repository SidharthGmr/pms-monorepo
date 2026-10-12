'use client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ContactMessageDto, ContactMessageStatusEnum } from '@pms/types';
import { ColumnDef } from '@tanstack/react-table';
import { format, formatDistanceToNow } from 'date-fns';
import { Eye, Mail, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { messageToneFor } from './message-status';

const HEADER = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

// An inbox, read left to right: who wrote, what about, when, where it stands. A NEW row leads
// with a dot and a bolder subject, the way an unread mail client row does.
export const useContactMessageColumns = (viewRecord: (id: number) => void, deleteRecord: (id: number) => void) =>
  useMemo<ColumnDef<ContactMessageDto>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        enableSorting: false,
        header: () => <span className={HEADER}>From</span>,
        cell: ({ row }) => {
          const message = row.original;
          return (
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold uppercase text-primary">
                {message.name.slice(0, 2)}
              </span>
              <div className="min-w-0">
                <p className="max-w-[180px] truncate text-sm font-medium" title={message.name}>
                  {message.name}
                </p>
                <p className="max-w-[180px] truncate text-[11px] text-muted-foreground" title={message.email}>
                  {message.email}
                </p>
              </div>
            </div>
          );
        },
        meta: { sortingKey: 'name', thClassName: 'pl-4', tdClassName: 'pl-4' },
      },
      {
        id: 'subject',
        accessorKey: 'subject',
        enableSorting: false,
        header: () => <span className={HEADER}>Message</span>,
        cell: ({ row }) => {
          const message = row.original;
          const isNew = message.status === ContactMessageStatusEnum.New;
          return (
            <button type="button" onClick={() => viewRecord(message.id)} className="block min-w-0 max-w-[320px] text-left">
              <span className="flex items-center gap-1.5">
                {isNew && <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />}
                <span className={cn('truncate text-sm hover:underline', isNew ? 'font-semibold' : 'font-medium')} title={message.subject}>
                  {message.subject}
                </span>
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">{message.message}</span>
            </button>
          );
        },
        meta: { sortingKey: 'subject' },
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        enableSorting: false,
        header: () => <span className={HEADER}>Received</span>,
        cell: ({ row }) => {
          const date = new Date(row.original.createdAt);
          return (
            <div className="flex flex-col gap-0.5 whitespace-nowrap" title={format(date, 'PPpp')}>
              <span className="text-xs font-medium tabular-nums">{format(date, 'd MMM yyyy, HH:mm')}</span>
              <span className="text-[11px] text-muted-foreground">{formatDistanceToNow(date, { addSuffix: true })}</span>
            </div>
          );
        },
        meta: { sortingKey: 'createdAt', thClassName: 'hidden md:table-cell', tdClassName: 'hidden md:table-cell' },
      },
      {
        id: 'status',
        accessorKey: 'status',
        enableSorting: false,
        header: () => <span className={HEADER}>Status</span>,
        cell: ({ row }) => {
          const tone = messageToneFor(row.original.status);
          return (
            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold', tone.soft, tone.text)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
              {tone.label}
            </span>
          );
        },
        meta: { sortingKey: 'status' },
      },
      {
        id: 'actions',
        enableSorting: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const message = row.original;
          return (
            <div className="flex items-center justify-end gap-0.5">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="Read message" aria-label={`Read message from ${message.name}`} onClick={() => viewRecord(message.id)}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="Reply by email">
                <a href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`} aria-label={`Reply to ${message.name}`}>
                  <Mail className="h-4 w-4" />
                </a>
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" title="Delete" aria-label={`Delete message from ${message.name}`} onClick={() => deleteRecord(message.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
        meta: { thClassName: 'w-28 pr-4', tdClassName: 'pr-4' },
      },
    ],
    [viewRecord, deleteRecord]
  );
