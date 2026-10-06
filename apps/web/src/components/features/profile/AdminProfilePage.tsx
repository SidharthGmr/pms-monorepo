'use client';

import { ProfileImageUploader } from '@/components/common/admin-media/profile-image-uploader';
import DateTimePicker from '@/components/common/data-time-picker/date-time-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import Response from '@/dtos/Response';
import { useUpdateProfile } from '@/hooks/service-hooks/useAccountService';
import { useGetUserById } from '@/hooks/service-hooks/useUserList.service.hook';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { zodResolver } from '@/lib/zod-resolver';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { profileValidator, UpdateProfileModel, UserDto } from '@pms/types';
import { AxiosResponse } from 'axios';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AtSign,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Globe,
  Hash,
  Loader2,
  Mail,
  Map,
  MapPin,
  Phone,
  Plus,
  RotateCcw,
  Save,
  Shield,
  ShieldCheck,
  Store,
  User,
  UserCog,
  XCircle,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

const SURFACE = 'rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm';

// Fields shown in the UI drive the completeness meter and the "add this" chips. `dateOfBirth` is
// kept in the DTO/model (@pms/types) but not counted, since not everyone wants it on file.
const TRACKED_FIELDS: { key: keyof UpdateProfileModel; label: string }[] = [
  { key: 'profileImageUrl', label: 'Photo' },
  { key: 'name', label: 'Full name' },
  { key: 'userName', label: 'Username' },
  { key: 'phone', label: 'Phone' },
  { key: 'bio', label: 'Bio' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
  { key: 'pincode', label: 'Pincode' },
];

function SectionCard({ icon, title, description, children }: { icon: ReactNode; title: string; description?: string; children: ReactNode }) {
  return (
    <section className={cn(SURFACE, 'overflow-hidden')}>
      <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3.5 sm:px-5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold leading-tight">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function FieldLabel({ icon: Icon, children }: { icon: React.ElementType; children: ReactNode }) {
  return (
    <FormLabel className="flex items-center gap-1.5 text-xs font-medium text-foreground/80">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {children}
    </FormLabel>
  );
}

function AccountRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: ReactNode }) {
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="mt-0.5 truncate text-sm font-medium">{value}</div>
      </div>
    </li>
  );
}

function VerifiedBadge({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="h-3.5 w-3.5" />
      {yes}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <XCircle className="h-3.5 w-3.5" />
      {no}
    </span>
  );
}

export default function AdminProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { status } = useSession();
  const { currentUser, isAuthenticated } = useGetCurrentUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const unitOfService = useMemo(() => container.get<IUnitOfService>(TYPES.IUnitOfService), []);
  const updateProfileMutation = useUpdateProfile();

  const userId = (currentUser as any)?.userId || '';
  const { data: dbUserResp, isLoading: isUserLoading } = useGetUserById(userId, !!userId);
  const dbUser = dbUserResp?.data?.data as UserDto | undefined;

  const form = useForm<UpdateProfileModel>({
    resolver: zodResolver(profileValidator),
    defaultValues: {
      name: '',
      userName: '',
      phone: '',
      dateOfBirth: undefined,
      address: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      bio: '',
    },
  });

  const { isDirty } = form.formState;
  useUnsavedChangesWarning(isDirty);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    const u = (dbUser as any) || currentUser;
    if (!u) return;
    form.reset({
      name: u.name || '',
      userName: u.userName || '',
      phone: u.phone || '',
      profileImageUrl: u.profileImageUrl || '',
      dateOfBirth: u.dateOfBirth ? new Date(u.dateOfBirth) : undefined,
      address: u.address || '',
      city: u.city || '',
      state: u.state || '',
      country: u.country || '',
      pincode: u.pincode || '',
      bio: u.bio || '',
    });
  }, [dbUser, currentUser, form]);

  const submitData = async (model: UpdateProfileModel) => {
    const formData = new FormData();

    Object.keys(model).forEach((key) => {
      const value = model[key as keyof UpdateProfileModel];
      if (key === 'dateOfBirth' && model[key] !== undefined) {
        formData.append(key, new Date(value as string).toISOString());
      } else {
        formData.append(key, value as string);
      }
    });

    setIsSubmitting(true);

    const response: AxiosResponse<Response<UserDto>> = await updateProfileMutation.mutateAsync(formData);

    if (response && (response.status === 200 || response.status === 201)) {
      toast({ variant: 'success', title: 'Profile updated successfully' });
      form.reset(model);
      setIsSubmitting(false);
    } else {
      setIsSubmitting(false);
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  };

  if (status === 'loading' || !isAuthenticated) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const values = form.watch();
  const displayName = values.name || currentUser?.name || 'Administrator';
  const displayUserName = values.userName || currentUser?.userName || 'admin';
  const email = dbUser?.email || currentUser?.email || '';
  const role = dbUser?.role || currentUser?.role || 'Admin';
  const storeCode = dbUser?.storeCode || currentUser?.storeCode || '';

  const missing = TRACKED_FIELDS.filter(({ key }) => {
    const v = values[key];
    return v == null || String(v).trim() === '';
  });
  const filledCount = TRACKED_FIELDS.length - missing.length;
  const completeness = Math.round((filledCount / TRACKED_FIELDS.length) * 100);
  const complete = completeness === 100;

  const location = [values.city, values.state, values.country].filter((v) => v && String(v).trim()).join(', ');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submitData)} className="mx-auto w-full max-w-6xl space-y-4 pb-24 sm:space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">My profile</h1>
            <p className="mt-1 text-sm text-muted-foreground">How you appear across the admin and on orders you create.</p>
          </div>
          <Button type="submit" size="sm" className="h-9" icon={Save} iconPlacement="left" loading={isSubmitting} disabled={isSubmitting || !isDirty}>
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
          <aside className="space-y-4 sm:space-y-5 lg:sticky lg:top-[72px]">
            <section className={cn(SURFACE, 'overflow-hidden')}>
              <div className="relative h-24 bg-gradient-to-br from-primary via-primary to-indigo-700">
                <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '16px 16px' }} aria-hidden />
                <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/15 blur-2xl" aria-hidden />
                <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                  <Shield className="h-3 w-3" />
                  {role}
                </span>
              </div>

              <div className="px-5 pb-5">
                <div className="-mt-14 flex justify-center">
                  <FormField
                    control={form.control}
                    name="profileImageUrl"
                    render={({ field }) => (
                      <FormItem className="m-0">
                        <FormControl>
                          <div className="rounded-full bg-card p-1.5 shadow-md ring-1 ring-border">
                            <ProfileImageUploader value={field.value || ''} onChange={field.onChange} showUrlInput={false} className="w-auto max-w-none gap-0" />
                          </div>
                        </FormControl>
                        <FormMessage className="text-center" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-3 text-center">
                  <h2 className="truncate text-lg font-bold tracking-tight">{displayName}</h2>
                  <p className="truncate text-sm text-muted-foreground">@{displayUserName}</p>
                  {location && (
                    <p className="mt-1.5 inline-flex max-w-full items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{location}</span>
                    </p>
                  )}
                </div>

                <div className="mt-4 rounded-lg border border-border/70 bg-muted/40 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">Profile completeness</span>
                    <span className={cn('font-bold tabular-nums', complete ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary')}>{completeness}%</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className={cn('h-full rounded-full transition-all duration-500', complete ? 'bg-emerald-500' : 'bg-primary')} style={{ width: `${completeness}%` }} />
                  </div>
                  {complete ? (
                    <p className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      All set, your profile is complete.
                    </p>
                  ) : (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {missing.map(({ key, label }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => key !== 'profileImageUrl' && form.setFocus(key)}
                          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                        >
                          <Plus className="h-3 w-3" />
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className={cn(SURFACE, 'px-5 py-4')}>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Account</h3>
              {isUserLoading && !dbUser ? (
                <div className="mt-3 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-7 w-7 rounded-md" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="mt-1 divide-y divide-border/70">
                  <AccountRow icon={Mail} label="Email" value={<span className="break-all" title={email}>{email || '—'}</span>} />
                  {storeCode && <AccountRow icon={Store} label="Store" value={<span className="font-mono">{storeCode}</span>} />}
                  <AccountRow icon={ShieldCheck} label="Verification" value={<VerifiedBadge ok={!!dbUser?.isEmailVerified} yes="Email verified" no="Email not verified" />} />
                  <AccountRow icon={Phone} label="Phone" value={<VerifiedBadge ok={!!dbUser?.isPhoneVerified} yes="Phone verified" no="Phone not verified" />} />
                  {dbUser?.lastLoginAt && (
                    <AccountRow icon={Clock} label="Last sign-in" value={<span title={format(new Date(dbUser.lastLoginAt), 'PPpp')}>{formatDistanceToNow(new Date(dbUser.lastLoginAt), { addSuffix: true })}</span>} />
                  )}
                  {dbUser?.createdAt && <AccountRow icon={CalendarDays} label="Member since" value={format(new Date(dbUser.createdAt), 'd MMM yyyy')} />}
                  <AccountRow
                    icon={User}
                    label="Status"
                    value={
                      <Badge variant={dbUser?.isActive === false ? 'destructive' : 'green'} className="rounded-full px-2 text-[10px]">
                        {dbUser?.isActive === false ? 'Inactive' : 'Active'}
                      </Badge>
                    }
                  />
                </ul>
              )}
            </section>
          </aside>

          <div className="min-w-0 space-y-4 sm:space-y-5">
            <SectionCard icon={<UserCog className="h-4 w-4" />} title="Personal information" description="Your name and how to reach you.">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel icon={User}>Full name</FieldLabel>
                      <FormControl>
                        <Input placeholder="Your full name" autoComplete="name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="userName"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel icon={AtSign}>Username</FieldLabel>
                      <FormControl>
                        <Input placeholder="username" autoComplete="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel icon={Phone}>Phone number</FieldLabel>
                      <FormControl>
                        <Input placeholder="10 to 15 digits" inputMode="tel" autoComplete="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel icon={CalendarDays}>Date of birth</FieldLabel>
                      <FormControl>
                        <div className="flex">
                          <DateTimePicker
                            placeholder="Select date"
                            mode="single"
                            value={field.value ? new Date(field.value) : undefined}
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date ?? undefined)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FieldLabel icon={FileText}>Bio</FieldLabel>
                      <FormControl>
                        <Textarea placeholder="A line or two about you, your role or what you look after." className="min-h-[96px] resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </SectionCard>

            <SectionCard icon={<MapPin className="h-4 w-4" />} title="Address" description="Your residential or business address.">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FieldLabel icon={MapPin}>Street address</FieldLabel>
                      <FormControl>
                        <Input placeholder="House, street, area" autoComplete="street-address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel icon={Building2}>City</FieldLabel>
                      <FormControl>
                        <Input placeholder="City" autoComplete="address-level2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel icon={Map}>State / province</FieldLabel>
                      <FormControl>
                        <Input placeholder="State" autoComplete="address-level1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel icon={Globe}>Country</FieldLabel>
                      <FormControl>
                        <Input placeholder="Country" autoComplete="country-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel icon={Hash}>Pincode / ZIP</FieldLabel>
                      <FormControl>
                        <Input placeholder="Postal code" inputMode="numeric" autoComplete="postal-code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </SectionCard>
          </div>
        </div>

        <div
          aria-hidden={!isDirty}
          className={cn(
            'pointer-events-none fixed inset-x-3 bottom-3 z-40 transition-all duration-300 sm:inset-x-auto sm:bottom-5 sm:left-1/2 sm:w-full sm:max-w-xl sm:-translate-x-1/2',
            isDirty ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          )}
        >
          <div className={cn('flex items-center justify-between gap-3 rounded-xl border bg-background/95 px-4 py-3 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/80', isDirty && 'pointer-events-auto')}>
            <p className="flex min-w-0 items-center gap-2 text-sm">
              <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
              <span className="truncate">You have unsaved changes</span>
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => form.reset()} disabled={isSubmitting}>
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Discard</span>
              </Button>
              <Button type="submit" size="sm" className="h-8" icon={Save} iconPlacement="left" loading={isSubmitting} disabled={isSubmitting}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
