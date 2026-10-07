'use client';

import ActiveStatusToggle from '@/components/common/active-status-toggle';
import CardAction from '@/components/common/card-action';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { UserDto } from '@/dtos/UserDto';
import { Roles } from '@/enums/roles.enum';
import { StatusValues } from '@/enums/status-values.enum';
import { cn } from '@/lib/utils';
import { getAvatarSoftColor, getInitialName } from '@/utils/avatar-color';
import { formatDistanceToNow } from 'date-fns';
import { BadgeCheck, Mail, Pencil, Phone, Trash2 } from 'lucide-react';
import Link from 'next/link';

type BadgeVariant = BadgeProps['variant'];

const ROLE_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
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

interface UserCardProps {
  user: UserDto;
  onEdit: () => void;
  onDelete: () => void;
}

// Card layout for the users grid. Same facts as a table row, stacked: identity on the banner,
// contact in the middle, access and last activity along the footer.
export default function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  const role = ROLE_BADGE[user.role];
  const status = String(user.status ?? '');
  const tone = STATUS_TONE[status];
  const avatarTone = getAvatarSoftColor(user.name);

  return (
    <Card className="group relative !p-0 overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative h-16 bg-gradient-to-r from-primary/25 via-primary/10 to-transparent">
        <div className="absolute inset-0 [background-image:linear-gradient(to_right,hsl(var(--border)/0.6)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.6)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <CardAction label={`Edit ${user.name}`} icon={Pencil} onClick={onEdit} className="hover:bg-primary hover:text-primary-foreground" />
          <CardAction label={`Delete ${user.name}`} icon={Trash2} onClick={onDelete} className="hover:bg-destructive hover:text-destructive-foreground" />
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="-mt-8 flex items-end justify-between gap-2">
          <Avatar className="h-16 w-16 shrink-0 ring-4 ring-card">
            {user.profileImageUrl && <AvatarImage src={user.profileImageUrl} alt={user.name} className="object-cover" />}
            <AvatarFallback className={cn('text-base font-bold uppercase', avatarTone.bg, avatarTone.text)}>{getInitialName(user.name)}</AvatarFallback>
          </Avatar>
          <Badge variant={role?.variant ?? 'zinc'} className="mb-1">
            {role?.label ?? user.role}
          </Badge>
        </div>

        <div className="mt-3 min-w-0">
          <Link href={`/admin/users/${user.usersId}`} className="block truncate text-sm font-semibold capitalize hover:underline" title={user.name}>
            {user.name}
          </Link>
          <div className="mt-1 flex items-center gap-2">
            {user.userName && <span className="truncate text-[11px] text-muted-foreground">@{user.userName}</span>}
            {status && (
              <span className={cn('inline-flex shrink-0 items-center gap-1 text-[11px] font-medium', tone?.text ?? 'text-muted-foreground')}>
                <span className={cn('h-1.5 w-1.5 rounded-full', tone?.dot ?? 'bg-muted-foreground')} />
                {status}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 space-y-1.5 border-t pt-3">
          <span className="flex items-center gap-1.5 text-xs">
            <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {user.email ? (
              <a href={`mailto:${user.email}`} className="min-w-0 truncate text-foreground/80 hover:text-primary hover:underline" title={user.email}>
                {user.email}
              </a>
            ) : (
              <span className="text-muted-foreground/60">No email</span>
            )}
            {user.email && user.isEmailVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-label="Email verified" />}
          </span>
          <span className="flex items-center gap-1.5 text-xs">
            <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {user.phone ? (
              <a href={`tel:${user.phone}`} className="min-w-0 truncate text-foreground/80 hover:text-primary hover:underline">
                {user.phone}
              </a>
            ) : (
              <span className="text-muted-foreground/60">No phone</span>
            )}
            {user.phone && user.isPhoneVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-label="Phone verified" />}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
          <ActiveStatusToggle user={user} />
          <span className="shrink-0 text-[11px] text-muted-foreground" title={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : undefined}>
            {user.lastLoginAt ? formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true }) : 'Never signed in'}
          </span>
        </div>
      </div>
    </Card>
  );
}
