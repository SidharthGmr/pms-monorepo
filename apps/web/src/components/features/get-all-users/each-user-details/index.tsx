'use client';

import { InfoRow, ProfileImage, YesNoBadge } from '@/components/common/profile-components';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { Roles } from '@/enums/roles.enum';
import { StatusValues } from '@/enums/status-values.enum';
import { useGetUserById } from '@/hooks/service-hooks/useUserList.service.hook';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { BadgeCheck, Cake, Clock, KeyRound, Mail, MapPin, Phone, ShieldCheck, Store, UserRound } from 'lucide-react';
import { ReactNode } from 'react';
import SectionCard from './section-card';

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

const dash = (value?: string | null) => (value?.toString().trim() ? value : '—');

export default function EachUserDetails({ userId }: { userId: string }) {
  const { data: getUserResponse, isLoading, isError } = useGetUserById(userId);
  const user = getUserResponse?.data?.data;

  const date = (value?: Date | string | null, withTime = false) =>
    value ? unitOfService.DateTimeService.convertToLocalDate(value as Date, withTime) : '—';

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-12">
        <Skeleton className="col-span-12 h-96 rounded-xl lg:col-span-4 xl:col-span-3" />
        <div className="col-span-12 space-y-4 lg:col-span-8 xl:col-span-9">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return <CardDescription className="py-10 text-center text-destructive">Failed to load this user.</CardDescription>;
  }

  if (!user) {
    return <CardDescription className="py-10 text-center">No user found.</CardDescription>;
  }

  const role = roleBadge[user.role];
  // The API sends the `Status` enum ("Published", "Draft", ...) though `UserDto` types it boolean.
  const status = String(user.status ?? '');
  const verifiedCount = [user.isEmailVerified, user.isPhoneVerified].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 space-y-4 lg:col-span-4 xl:col-span-3">
          <Card className="overflow-hidden !p-0">
            <CardContent className="space-y-2 p-0">
              <ProfileImage src={user.profileImageUrl} alt={user.name || 'User profile picture'} />

              <div className="space-y-4 p-2 text-center">
                <div className="space-y-2">
                  <CardTitle className="text-xl font-bold capitalize">{dash(user.name)}</CardTitle>

                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <Badge variant={role?.variant ?? 'zinc'}>{role?.label ?? user.role}</Badge>
                    {status && <Badge variant={statusBadge[status] ?? 'zinc'}>{status}</Badge>}
                  </div>

                  <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                    {user.email && (
                      <span className="inline-flex items-start gap-1 break-all">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        {user.email}
                        {user.isEmailVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-500" />}
                      </span>
                    )}
                    {user.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        {user.phone}
                        {user.isPhoneVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-500" />}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-2 text-left">
                  <InfoRow label="Username" value={dash(user.userName)} />
                  <InfoRow label="Store" value={dash(user.storeCode)} />
                  <InfoRow label="Active" value={<YesNoBadge value={user.isActive} />} />
                  <InfoRow label="Email verified" value={<YesNoBadge value={user.isEmailVerified} />} />
                  <InfoRow label="Phone verified" value={<YesNoBadge value={user.isPhoneVerified} />} />
                  <InfoRow label="Signed up in store" value={<YesNoBadge value={user.isRegisterbyShop} />} />
                  <InfoRow label="Member since" value={date(user.createdAt)} />
                  <InfoRow label="Last login" value={date(user.lastLoginAt, true)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 space-y-4 lg:col-span-8 xl:col-span-9">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile icon={<ShieldCheck className="h-4 w-4" />} label="Role" value={role?.label ?? user.role} tone="indigo" />
            <StatTile icon={<Store className="h-4 w-4" />} label="Store" value={dash(user.storeCode)} tone="sky" />
            <StatTile icon={<BadgeCheck className="h-4 w-4" />} label="Verified" value={`${verifiedCount}/2`} tone="green" />
            <StatTile icon={<KeyRound className="h-4 w-4" />} label="Failed logins" value={user.loginAttempts ?? 0} tone="amber" />
          </div>

          <SectionCard title="Account" icon={<UserRound className="h-4 w-4" />}>
            <div className="grid gap-2 sm:grid-cols-2">
              <InfoRow label="User ID" value={<span className="font-mono text-[11px]">{dash(user.usersId)}</span>} />
              <InfoRow label="Account status" value={status ? <Badge variant={statusBadge[status] ?? 'zinc'}>{status}</Badge> : '—'} />
              <InfoRow label="Last login IP" value={<span className="font-mono text-[11px]">{dash(user.lastLoginIP)}</span>} />
              <InfoRow label="Failed login attempts" value={user.loginAttempts ?? 0} />
              <InfoRow label="Created" value={date(user.createdAt, true)} />
              <InfoRow label="Last updated" value={date(user.updatedAt, true)} />
            </div>
          </SectionCard>

          <SectionCard title="Address" icon={<MapPin className="h-4 w-4" />}>
            <div className="grid gap-2 sm:grid-cols-2">
              <InfoRow label="Address" value={dash(user.address)} className="sm:col-span-2" />
              <InfoRow label="City" value={dash(user.city)} />
              <InfoRow label="State" value={dash(user.state)} />
              <InfoRow label="Country" value={dash(user.country)} />
              <InfoRow label="Pincode" value={dash(user.pincode)} />
            </div>
          </SectionCard>

          <SectionCard title="Personal" icon={<Cake className="h-4 w-4" />}>
            <div className="grid gap-2">
              <InfoRow label="Date of birth" value={date(user.dateOfBirth)} />
              <InfoRow label="Bio" value={dash(user.bio)} />
            </div>
          </SectionCard>

          {/* Sessions are not part of the user payload; `lastLoginAt` above is what the API exposes. */}
          <SectionCard title="Activity" icon={<Clock className="h-4 w-4" />}>
            <div className="grid gap-2 sm:grid-cols-2">
              <InfoRow label="Last login" value={date(user.lastLoginAt, true)} />
              <InfoRow label="Signed up in store" value={<YesNoBadge value={user.isRegisterbyShop} />} />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function StatTile({ icon, label, value, tone }: { icon: ReactNode; label: string; value: ReactNode; tone: 'green' | 'amber' | 'indigo' | 'sky' }) {
  const toneClass = {
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    sky: 'bg-sky-50 text-sky-600',
  }[tone];

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-background p-3 transition-all hover:shadow-sm">
      <span className={`grid h-9 w-9 shrink-0 place-content-center rounded-lg ${toneClass}`}>{icon}</span>
      <div className="min-w-0">
        <div className="truncate text-lg font-bold leading-none text-foreground tabular-nums">{value}</div>
        <div className="mt-1 truncate text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
