'use client';

import ActiveStatusToggle from '@/components/common/active-status-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { UserDto } from '@/dtos/UserDto';
import { Roles } from '@/enums/roles.enum';
import { StatusValues } from '@/enums/status-values.enum';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { getAvatarSoftColor, getInitialName } from '@/utils/avatar-color';
import { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';
import { BadgeCheck, Mail, Pencil, Phone, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

const HEADER = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

type BadgeVariant = BadgeProps['variant'];

const roleBadge: Record<string, { label: string; variant: BadgeVariant }> = {
  [Roles.SUPER_ADMIN]: { label: 'Super Admin', variant: 'purple' },
  [Roles.ADMIN]: { label: 'Admin', variant: 'indigo' },
  [Roles.STAFF]: { label: 'Staff', variant: 'blue' },
  [Roles.USER]: { label: 'Customer', variant: 'zinc' },
};

const STATUS_TONE: Record<string, { dot: string; text: string }> = {
  [StatusValues.Published]: { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
  [StatusValues.Draft]: { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400' },
  [StatusValues.InReview]: { dot: 'bg-sky-500', text: 'text-sky-700 dark:text-sky-400' },
  [StatusValues.Reject]: { dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400' },
  [StatusValues.Trash]: { dot: 'bg-zinc-400', text: 'text-muted-foreground' },
};

// A contact line that says at a glance whether the address or number has been verified.
function ContactLine({ icon: Icon, value, href, emptyLabel, verified }: { icon: typeof Mail; value?: string | null; href?: string; emptyLabel: string; verified?: boolean }) {
  if (!value) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {emptyLabel}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-xs">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <a href={href} className="min-w-0 truncate text-foreground/80 hover:text-primary hover:underline" title={value}>
        {value}
      </a>
      {verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-label="Verified" />}
    </span>
  );
}

export const useUserColumns = (editRecord?: (id: string) => void, deleteRecord?: (id: string) => void) =>
  useMemo<ColumnDef<UserDto>[]>(
    () => [
      {
        id: 'user',
        accessorKey: 'name',
        enableSorting: false,
        header: () => <span className={HEADER}>User</span>,
        cell: ({ row }) => {
          const user = row.original;
          const tone = getAvatarSoftColor(user.name);

          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 shrink-0">
                {user.profileImageUrl && <AvatarImage src={user.profileImageUrl} alt={user.name} className="object-cover" />}
                <AvatarFallback className={cn('text-[13px] font-bold uppercase', tone.bg, tone.text)}>{getInitialName(user.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <Link href={`/admin/users/${user.usersId}`} className="block max-w-[220px] truncate text-sm font-semibold capitalize hover:underline" title={user.name}>
                  {user.name}
                </Link>
                <p className="truncate text-[11px] text-muted-foreground">{user.userName ? `@${user.userName}` : user.email}</p>
              </div>
            </div>
          );
        },
        meta: { sortingKey: 'name', thClassName: 'pl-4', tdClassName: 'pl-4' },
      },
      {
        id: 'role',
        accessorKey: 'role',
        enableSorting: false,
        header: () => <span className={HEADER}>Role</span>,
        cell: ({ row }) => {
          const role = roleBadge[row.original.role];
          return <Badge variant={role?.variant ?? 'zinc'}>{role?.label ?? row.original.role}</Badge>;
        },
        meta: { sortingKey: 'role' },
      },
      {
        id: 'contact',
        accessorKey: 'email',
        enableSorting: false,
        header: () => <span className={HEADER}>Contact</span>,
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex max-w-[260px] flex-col gap-1">
              <ContactLine icon={Mail} value={user.email} href={`mailto:${user.email}`} emptyLabel="No email" verified={user.isEmailVerified} />
              <ContactLine icon={Phone} value={user.phone} href={`tel:${user.phone}`} emptyLabel="No phone" verified={user.isPhoneVerified} />
            </div>
          );
        },
        meta: { sortingKey: 'email', thClassName: 'hidden md:table-cell', tdClassName: 'hidden md:table-cell' },
      },
      {
        id: 'status',
        accessorKey: 'status',
        enableSorting: false,
        header: () => <span className={HEADER}>Status</span>,
        cell: ({ row }) => {
          // The API sends the `Status` enum ("Published", "Draft", ...) even though `UserDto`
          // declares a boolean, so a truthy check painted every row green.
          const status = String(row.original.status ?? '');
          const tone = STATUS_TONE[status];
          if (!status) return <span className="text-xs text-muted-foreground/60">—</span>;

          return (
            <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', tone?.text ?? 'text-muted-foreground')}>
              <span className={cn('h-1.5 w-1.5 rounded-full', tone?.dot ?? 'bg-muted-foreground')} />
              {status}
            </span>
          );
        },
        meta: { sortingKey: 'status' },
      },
      {
        id: 'activity',
        accessorKey: 'isActive',
        enableSorting: false,
        header: () => <span className={HEADER}>Access</span>,
        cell: ({ row }) => <ActiveStatusToggle user={row.original} />,
        meta: { sortingKey: 'isActive' },
      },
      {
        id: 'lastActive',
        accessorKey: 'lastLoginAt',
        enableSorting: false,
        header: () => <span className={HEADER}>Last active</span>,
        cell: ({ row }) => {
          const lastLoginAt = row.original.lastLoginAt;
          if (!lastLoginAt) return <span className="whitespace-nowrap text-xs text-muted-foreground/60">Never signed in</span>;

          return (
            <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground" title={unitOfService.DateTimeService.convertToLocalDate(lastLoginAt, true)}>
              {formatDistanceToNow(new Date(lastLoginAt), { addSuffix: true })}
            </span>
          );
        },
        meta: { sortingKey: 'lastLoginAt', thClassName: 'hidden lg:table-cell', tdClassName: 'hidden lg:table-cell' },
      },
      {
        id: 'actions',
        enableSorting: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-0.5">
            {editRecord && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={() => editRecord(row.original.usersId)}
                aria-label={`Edit ${row.original.name}`}
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {deleteRecord && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => deleteRecord(row.original.usersId)}
                aria-label={`Delete ${row.original.name}`}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
        meta: { thClassName: 'w-24 pr-4', tdClassName: 'pr-4' },
      },
    ],
    [editRecord, deleteRecord]
  );
