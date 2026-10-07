'use client';

import { Badge, BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { Roles } from '@/enums/roles.enum';
import { StatusValues } from '@/enums/status-values.enum';
import { useGetUserById } from '@/hooks/service-hooks/useUserList.service.hook';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { Role, UserDto } from '@pms/types';
import {
  AlertTriangle,
  BadgeCheck,
  Cake,
  Camera,
  Check,
  Clock,
  Copy,
  Globe,
  KeyRound,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  Store,
  UserRound,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ReactNode, useState } from 'react';
import StaffDetails from '../staff';
import EditUserPhoto from '../edit-photo';
import EditUserProfile from '../edit-profile';

const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

type BadgeVariant = BadgeProps['variant'];

/** Same wording as the users list and its role filter. */
const roleBadge: Record<string, { label: string; variant: BadgeVariant }> = {
  [Roles.SUPER_ADMIN]: { label: 'Super Admin', variant: 'purple' },
  [Roles.ADMIN]: { label: 'Admin', variant: 'indigo' },
  [Roles.STAFF]: { label: 'Staff', variant: 'blue' },
  [Roles.USER]: { label: 'Customer', variant: 'zinc' },
};

const statusBadge: Record<string, BadgeVariant> = {
  [StatusValues.Published]: 'green',
  [StatusValues.Draft]: 'amber',
  [StatusValues.InReview]: 'blue',
  [StatusValues.Reject]: 'rose',
  [StatusValues.Trash]: 'zinc',
};

const dash = (value?: string | number | null) => (value?.toString().trim() ? value : '—');

const initials = (name?: string | null) =>
  (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('') || '?';

export default function EachUserDetails({ userId }: { userId: string }) {
  const { data: getUserResponse, isLoading, isError, refetch } = useGetUserById(userId);
  const user = getUserResponse?.data?.data as UserDto;

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [copied, setCopied] = useState('');

  // Editing another account is an admin action, matching the guards on the user endpoints.
  const { currentUser } = useGetCurrentUser();
  const canEdit = currentUser?.role === Roles.SUPER_ADMIN || currentUser?.role === Roles.ADMIN;

  const date = (value?: Date | string | null, withTime = false) => (value ? unitOfService.DateTimeService.convertToLocalDate(value as Date, withTime) : '—');

  const copy = (value: string, key: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  };

  if (isLoading) return <UserDetailsSkeleton />;

  if (isError || !user) {
    return (
      <Card className="py-16 text-center">
        <AlertTriangle className="mx-auto h-7 w-7 text-destructive/70" />
        <p className="mt-3 text-sm font-semibold">{isError ? 'Could not load this user' : 'No user found'}</p>
        <p className="mt-1 text-xs text-muted-foreground">{isError ? 'Check your connection and try again.' : 'The account may have been removed.'}</p>
        <Button asChild variant="outline" size="sm" className="mt-5">
          <Link href="/admin/users">Back to users</Link>
        </Button>
      </Card>
    );
  }

  const role = roleBadge[user.role];
  // The API sends the `Status` enum ("Published", "Draft", ...) though `UserDto` types it boolean.
  const status = String(user.status ?? '');
  const verifiedCount = [user.isEmailVerified, user.isPhoneVerified].filter(Boolean).length;
  const place = [user.city, user.state, user.country].filter(Boolean).join(', ');

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden !p-0">
        <div className="relative h-24 bg-gradient-to-r from-primary/30 via-primary/15 to-transparent sm:h-28">
          <div className="absolute inset-0 [background-image:linear-gradient(to_right,hsl(var(--border)/0.6)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.6)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        </div>

        <div className="px-4 pb-4 sm:px-6 sm:pb-5">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar user={user} canEdit={canEdit} onEdit={() => setShowPhotoModal(true)} />

              <div className="min-w-0 pb-1">
                <h1 className="truncate text-xl font-bold capitalize tracking-tight sm:text-2xl">{dash(user.name)}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant={role?.variant ?? 'zinc'}>{role?.label ?? user.role}</Badge>
                  {status && <Badge variant={statusBadge[status] ?? 'zinc'}>{status}</Badge>}
                  {user.userName && <span className="text-xs text-muted-foreground">@{user.userName}</span>}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {user.email && (
                <Button asChild type="button" variant="outline" size="sm" className="h-9 gap-1.5">
                  <a href={`mailto:${user.email}`}>
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </a>
                </Button>
              )}
              {user.phone && (
                <Button asChild type="button" variant="outline" size="sm" className="h-9 gap-1.5">
                  <a href={`tel:${user.phone}`}>
                    <Phone className="h-3.5 w-3.5" />
                    Call
                  </a>
                </Button>
              )}
              {canEdit && (
                <>
                  <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setShowPhotoModal(true)}>
                    <Camera className="h-3.5 w-3.5" />
                    Photo
                  </Button>
                  <Button type="button" size="sm" className="h-9 gap-1.5" onClick={() => setShowEditModal(true)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit profile
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3 text-[11px] text-muted-foreground">
            <CopyChip label="User ID" value={user.usersId} copied={copied === 'id'} onCopy={() => copy(user.usersId, 'id')} />
            <span className="inline-flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5" />
              {dash(user.storeCode)}
            </span>
            {place && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {place}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Member since {date(user.createdAt)}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={<ShieldCheck className="h-4 w-4" />} label="Role" value={role?.label ?? user.role} tone="indigo" />
        <StatTile icon={<Store className="h-4 w-4" />} label="Store" value={dash(user.storeCode)} tone="sky" />
        <StatTile icon={<BadgeCheck className="h-4 w-4" />} label="Verified contacts" value={`${verifiedCount}/2`} tone={verifiedCount === 2 ? 'green' : 'amber'} />
        <StatTile icon={<KeyRound className="h-4 w-4" />} label="Failed logins" value={user.loginAttempts ?? 0} tone={user.loginAttempts ? 'rose' : 'green'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel title="Account" icon={UserRound}>
            <dl className="grid gap-x-6 sm:grid-cols-2">
              <Field label="Full name" value={dash(user.name)} />
              <Field label="Username" value={user.userName ? `@${user.userName}` : '—'} />
              <Field label="Account status" value={status ? <Badge variant={statusBadge[status] ?? 'zinc'}>{status}</Badge> : '—'} />
              <Field label="Active" value={<Flag value={user.isActive} yes="Active" no="Inactive" />} />
              <Field label="Signed up in store" value={<Flag value={user.isRegisterbyShop} />} />
              <Field label="Store code" value={<span className="font-mono text-xs">{dash(user.storeCode)}</span>} />
              <Field label="Created" value={date(user.createdAt, true)} />
              <Field label="Last updated" value={date(user.updatedAt, true)} />
            </dl>
          </Panel>

          {user.role === Role.staff && (
            <Panel title="Staff record" icon={Clock}>
              <div className="grid gap-2 sm:grid-cols-2">
                <StaffDetails userId={userId} />
              </div>
            </Panel>
          )}

          <Panel title="Address" icon={MapPin}>
            <dl className="grid gap-x-6 sm:grid-cols-2">
              <Field label="Street address" value={dash(user.address)} className="sm:col-span-2" />
              <Field label="City" value={dash(user.city)} />
              <Field label="State" value={dash(user.state)} />
              <Field label="Country" value={dash(user.country)} />
              <Field label="Pincode" value={dash(user.pincode)} />
            </dl>
          </Panel>

          <Panel title="Personal" icon={Cake}>
            <dl className="grid gap-x-6">
              <Field label="Date of birth" value={date(user.dateOfBirth)} />
              <Field label="Bio" value={dash(user.bio)} />
            </dl>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Contact" icon={Mail}>
            <div className="space-y-2">
              <ContactRow
                icon={Mail}
                label="Email"
                value={user.email}
                href={user.email ? `mailto:${user.email}` : undefined}
                verified={user.isEmailVerified}
                copied={copied === 'email'}
                onCopy={user.email ? () => copy(user.email, 'email') : undefined}
              />
              <ContactRow
                icon={Phone}
                label="Phone"
                value={user.phone}
                href={user.phone ? `tel:${user.phone}` : undefined}
                verified={user.isPhoneVerified}
                copied={copied === 'phone'}
                onCopy={user.phone ? () => copy(user.phone as string, 'phone') : undefined}
              />
            </div>
          </Panel>

          <Panel title="Security" icon={KeyRound}>
            <dl className="grid gap-x-6">
              <Field label="Last login" value={date(user.lastLoginAt, true)} />
              <Field label="Last login IP" value={<span className="font-mono text-xs">{dash(user.lastLoginIP)}</span>} />
              <Field
                label="Failed attempts"
                value={<span className={cn('font-semibold tabular-nums', user.loginAttempts ? 'text-amber-600 dark:text-amber-400' : '')}>{user.loginAttempts ?? 0}</span>}
              />
              <Field label="Email verified" value={<Flag value={user.isEmailVerified} />} />
              <Field label="Phone verified" value={<Flag value={user.isPhoneVerified} />} />
            </dl>
          </Panel>

          <Panel title="Storefront" icon={Globe}>
            <p className="text-xs text-muted-foreground">Open this account&apos;s orders to see what they have bought from {dash(user.storeCode)}.</p>
            <Button asChild variant="outline" size="sm" className="mt-3 w-full">
              <Link href={`/admin/orders?search=${encodeURIComponent(user.name || user.email || '')}`}>View orders</Link>
            </Button>
          </Panel>
        </div>
      </div>

      {showPhotoModal && (
        <EditUserPhoto
          isOpen={showPhotoModal}
          userId={userId}
          currentImageUrl={user.profileImageUrl}
          userName={user.name}
          onClose={(refresh) => {
            setShowPhotoModal(false);
            if (refresh) refetch();
          }}
        />
      )}

      {showEditModal && (
        <EditUserProfile
          isOpen={showEditModal}
          userId={userId}
          onClose={(refresh) => {
            setShowEditModal(false);
            if (refresh) refetch();
          }}
        />
      )}
    </div>
  );
}

function Avatar({ user, canEdit, onEdit }: { user: UserDto; canEdit: boolean; onEdit: () => void }) {
  // The photo has its own dialog, and the avatar is the way into it.
  const Wrapper = canEdit ? 'button' : 'span';

  return (
    <Wrapper
      {...(canEdit ? { type: 'button' as const, onClick: onEdit, 'aria-label': 'Change profile photo' } : {})}
      className={cn('group relative block h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-muted ring-4 ring-background sm:h-24 sm:w-24', canEdit && 'cursor-pointer')}
    >
      {user.profileImageUrl ? (
        <Image src={user.profileImageUrl} alt={user.name || 'User profile picture'} fill sizes="96px" className="object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-primary/10 text-2xl font-bold text-primary">{initials(user.name)}</span>
      )}

      {canEdit && (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-foreground/60 text-background opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Camera className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Change</span>
        </span>
      )}

      <span
        className={cn('absolute bottom-1.5 right-1.5 h-3 w-3 rounded-full ring-2 ring-background', user.isActive ? 'bg-emerald-500' : 'bg-muted-foreground')}
        title={user.isActive ? 'Active' : 'Inactive'}
      />
    </Wrapper>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Mail; children: ReactNode }) {
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </Card>
  );
}

function Field({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 border-b border-dashed py-2 last:border-0', className)}>
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right text-sm font-medium">{value}</dd>
    </div>
  );
}

function Flag({ value, yes = 'Yes', no = 'No' }: { value?: boolean; yes?: string; no?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm font-medium', value ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
      <span className={cn('h-1.5 w-1.5 rounded-full', value ? 'bg-emerald-500' : 'bg-muted-foreground/50')} />
      {value ? yes : no}
    </span>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
  verified,
  copied,
  onCopy,
}: {
  icon: typeof Mail;
  label: string;
  value?: string | null;
  href?: string;
  verified?: boolean;
  copied: boolean;
  onCopy?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        {value ? (
          <a href={href} className="block truncate text-sm font-medium hover:text-primary hover:underline" title={value}>
            {value}
          </a>
        ) : (
          <p className="text-sm text-muted-foreground/60">Not provided</p>
        )}
      </div>
      {value && verified && <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-label={`${label} verified`} />}
      {value && onCopy && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" onClick={onCopy} aria-label={`Copy ${label.toLowerCase()}`} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{copied ? 'Copied' : `Copy ${label.toLowerCase()}`}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

function CopyChip({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      <span className="shrink-0">{label}</span>
      <code className="min-w-0 max-w-[180px] truncate font-mono text-foreground/80" title={value}>
        {value}
      </code>
      <button type="button" onClick={onCopy} aria-label={`Copy ${label.toLowerCase()}`} className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-muted hover:text-foreground">
        {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      </button>
    </span>
  );
}

function StatTile({ icon, label, value, tone }: { icon: ReactNode; label: string; value: ReactNode; tone: 'green' | 'amber' | 'indigo' | 'sky' | 'rose' }) {
  const toneClass = {
    green: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    indigo: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
    sky: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
    rose: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  }[tone];

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-shadow hover:shadow-sm">
      <span className={cn('grid h-9 w-9 shrink-0 place-content-center rounded-lg', toneClass)}>{icon}</span>
      <div className="min-w-0">
        <div className="truncate text-base font-bold leading-none tabular-nums" title={String(value)}>
          {value}
        </div>
        <div className="mt-1 truncate text-[11px] text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function UserDetailsSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden !p-0">
        <Skeleton className="h-24 rounded-none sm:h-28" />
        <div className="px-4 pb-4 sm:px-6">
          <div className="-mt-12 flex items-end gap-4 sm:-mt-14">
            <Skeleton className="h-20 w-20 rounded-2xl sm:h-24 sm:w-24" />
            <div className="space-y-2 pb-1">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <Skeleton className="mt-5 h-4 w-full max-w-md" />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <Skeleton key={index} className="h-[66px] rounded-xl" />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-52 rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
