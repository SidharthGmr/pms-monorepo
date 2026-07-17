'use client';

import { ProfileImageUploader } from '@/components/common/admin-media/profile-image-uploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useUpdateProfile } from '@/hooks/service-hooks/useAccountService';
import { useGetUserById } from '@/hooks/service-hooks/useUserList.service.hook';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { profileFields, type ProfileFormValues, type UpdateProfileModel } from '@pms/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Building, CheckCircle2, Compass, FileText, Globe, Hash, Loader2, Mail, Map, MapPin, Phone, Save, Shield, User, UserCog } from 'lucide-react';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const DEFAULT_VALUES: ProfileFormValues = {
  name: '',
  userName: '',
  phone: '',
  profileImageUrl: '',
  address: '',
  city: '',
  state: '',
  country: '',
  pincode: '',
  bio: '',
};

// Fields shown in the UI — drives the completeness meter. `dateOfBirth` is kept
// in the DTO/model (@pms/types) but intentionally not surfaced in the UI.
const TRACKED_FIELDS: (keyof ProfileFormValues)[] = [
  'name',
  'userName',
  'phone',
  'profileImageUrl',
  'address',
  'city',
  'state',
  'country',
  'pincode',
  'bio',
];

/** A card section with an icon badge, title and description. */
function SectionCard({ icon, title, description, children }: { icon: ReactNode; title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="border-0 p-0 shadow-sm ring-1 ring-slate-200 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            {description && <p className="text-xs text-slate-500">{description}</p>}
          </div>
        </div>
        <div className="p-5">{children}</div>
      </CardContent>
    </Card>
  );
}

export default function AdminProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, status, update } = useSession();
  const { currentUser, isAuthenticated } = useGetCurrentUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const unitOfService = useMemo(() => container.get<IUnitOfService>(TYPES.IUnitOfService), []);
  const updateProfileMutation = useUpdateProfile();

  // The NextAuth session only carries JWT fields (userId/name/email/role), so
  // load the full profile from the DB — otherwise saved fields like
  // profileImageUrl/address never round-trip back into the form.
  const userId = (currentUser as any)?.userId || '';
  const { data: dbUserResp, refetch: refetchUser } = useGetUserById(userId, !!userId);
  const dbUser = dbUserResp?.data?.data;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFields),
    defaultValues: DEFAULT_VALUES,
  });

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
      address: u.address || '',
      city: u.city || '',
      state: u.state || '',
      country: u.country || '',
      pincode: u.pincode || '',
      bio: u.bio || '',
    });
  }, [dbUser, currentUser, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      const payload: UpdateProfileModel = { ...data };
      const response = await updateProfileMutation.mutateAsync(payload);

      if (response && (response.status === 200 || response.status === 201)) {
        toast({ variant: 'success', title: 'Profile updated successfully' });

        // Re-pull the saved record from the DB so all fields reflect what persisted.
        await refetchUser();

        if (update) {
          await update({
            ...session?.user,
            name: data.name,
            userName: data.userName,
            phone: data.phone,
            profileImageUrl: data.profileImageUrl,
          });
        }
      } else {
        const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
        toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
      }
    } catch (error: any) {
      const errorMessage = unitOfService.ErrorHandlerService.getErrorMessage(error?.response || error);
      toast({ variant: 'destructive', title: 'Error', description: <span>{errorMessage}</span> });
    } finally {
      setIsSubmitting(false);
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

  const filledCount = TRACKED_FIELDS.filter((k) => {
    const v = values[k];
    return v != null && String(v).trim() !== '';
  }).length;
  const completeness = Math.round((filledCount / TRACKED_FIELDS.length) * 100);

  const inputClass = 'focus-visible:ring-primary';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-6xl space-y-5 p-4 md:p-6 pb-24"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Identity header */}
          <Card className="border-0 p-0 shadow-sm ring-1 ring-slate-200 overflow-hidden">
            <div className="relative h-28 bg-gradient-to-br from-primary to-secondary md:h-32">
              <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
              <div className="absolute -bottom-10 left-16 h-24 w-24 rounded-full bg-white/5" />
              <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                <Shield className="h-3.5 w-3.5" />
                {currentUser?.role || 'Admin'}
              </span>
            </div>

            <CardContent className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="-mt-16 shrink-0">
                  <FormField
                    control={form.control}
                    name="profileImageUrl"
                    render={({ field }) => (
                      <FormItem className="m-0">
                        <FormControl>
                          <div className="rounded-full bg-background p-1.5 shadow-md ring-1 ring-slate-200">
                            <ProfileImageUploader
                              value={field.value || ''}
                              onChange={field.onChange}
                              className="h-28 w-28 rounded-full object-cover"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="min-w-0 flex-1 pb-1">
                  <h1 className="truncate text-xl font-bold tracking-tight text-slate-900">{displayName}</h1>
                  <p className="text-sm text-muted-foreground">@{displayUserName}</p>
                  {currentUser?.email && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 text-primary" />
                      <span className="truncate">{currentUser.email}</span>
                    </p>
                  )}
                </div>

                <div className="w-full sm:w-56 sm:pb-1">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">Profile completeness</span>
                    <span className={`font-bold tabular-nums ${completeness === 100 ? 'text-emerald-600' : 'text-primary'}`}>{completeness}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${completeness === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                      style={{ width: `${completeness}%` }}
                    />
                  </div>
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    {completeness === 100 ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" /> All set — your profile is complete.
                      </>
                    ) : (
                      `${filledCount} of ${TRACKED_FIELDS.length} fields filled`
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <SectionCard icon={<UserCog className="h-4 w-4" />} title="Personal Information" description="Your general account information.">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5 text-slate-700">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        Full Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" className={inputClass} {...field} />
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
                      <FormLabel className="flex items-center gap-1.5 text-slate-700">
                        <Hash className="h-3.5 w-3.5 text-slate-400" />
                        Username
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your username" className={inputClass} {...field} />
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
                      <FormLabel className="flex items-center gap-1.5 text-slate-700">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        Phone Number
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your phone number" className={inputClass} {...field} />
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
                      <FormLabel className="flex items-center gap-1.5 text-slate-700">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        Bio / Summary
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about yourself, your skills, or role description..."
                          className={`min-h-[96px] resize-none ${inputClass}`}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </SectionCard>

            <SectionCard icon={<MapPin className="h-4 w-4" />} title="Address & Location" description="Your residential or business address.">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="flex items-center gap-1.5 text-slate-700">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        Address Line
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your street address" className={inputClass} {...field} />
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
                      <FormLabel className="flex items-center gap-1.5 text-slate-700">
                        <Building className="h-3.5 w-3.5 text-slate-400" />
                        City
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your city" className={inputClass} {...field} />
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
                      <FormLabel className="flex items-center gap-1.5 text-slate-700">
                        <Map className="h-3.5 w-3.5 text-slate-400" />
                        State / Province
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your state" className={inputClass} {...field} />
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
                      <FormLabel className="flex items-center gap-1.5 text-slate-700">
                        <Globe className="h-3.5 w-3.5 text-slate-400" />
                        Country
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your country" className={inputClass} {...field} />
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
                      <FormLabel className="flex items-center gap-1.5 text-slate-700">
                        <Compass className="h-3.5 w-3.5 text-slate-400" />
                        Pincode / ZIP
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your pincode" className={inputClass} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  size="lg"
                  icon={Save}
                  iconPlacement="left"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  className="w-full font-semibold sm:w-auto sm:min-w-[200px]"
                >
                  {isSubmitting ? 'Saving changes...' : 'Save Changes'}
                </Button>
              </div>
            </SectionCard>
          </div>

          {/* <div className="sticky bottom-4 z-10">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/95 px-5 py-3.5 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-white/80">
              <p className="hidden text-sm text-muted-foreground sm:block">Review your details, then save your changes.</p>
             
            </div>
          </div> */}
        </form>
      </Form>
    </motion.div>
  );
}
