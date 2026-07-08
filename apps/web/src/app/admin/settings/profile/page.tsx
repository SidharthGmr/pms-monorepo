'use client';

import { ProfileImageUploader } from '@/components/common/admin-media/profile-image-uploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useUpdateProfile } from '@/hooks/service-hooks/useAccountService';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Globe,
  Compass,
  Save,
  Shield,
  Map,
  Building,
  Hash,
  Sparkles,
  Loader2,
  FileText
} from 'lucide-react';

const profileFormSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters.' }),
  userName: z.string().optional(),
  phone: z.string().optional(),
  profileImageUrl: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  bio: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function AdminProfilePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const { currentUser, isAuthenticated } = useGetCurrentUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      userName: '',
      phone: '',
      profileImageUrl: '',
      dateOfBirth: '',
      address: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      bio: '',
    },
  });

  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const updateProfileMutation = useUpdateProfile();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (currentUser) {
      form.reset({
        name: currentUser.name || '',
        userName: currentUser.userName || '',
        phone: currentUser.phone || '',
        profileImageUrl: currentUser.profileImageUrl || '',
        dateOfBirth: currentUser.dateOfBirth ? new Date(currentUser.dateOfBirth).toISOString().split('T')[0] : '',
        address: currentUser.address || '',
        city: currentUser.city || '',
        state: currentUser.state || '',
        country: currentUser.country || '',
        pincode: currentUser.pincode || '',
        bio: currentUser.bio || '',
      });
    }
  }, [currentUser, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      };

      const response = await updateProfileMutation.mutateAsync(payload);

      if (response && (response.status === 200 || response.status === 201)) {
        toast({ variant: 'success', title: 'Profile updated successfully' });

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
        toast({ variant: 'destructive', title: 'Error', description: error });
      }
    } catch (error: any) {
      const errorMessage = unitOfService.ErrorHandlerService.getErrorMessage(error.response || error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || !isAuthenticated) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const watchedName = form.watch('name') || currentUser?.name || 'Administrator';
  const watchedUserName = form.watch('userName') || currentUser?.userName || 'admin';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto p-4 md:p-8 space-y-8"
    >
      {/* Premium Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 h-48 md:h-60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent)]" />
        <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5 text-white text-xs font-semibold">
          <Shield className="h-3.5 w-3.5" />
          Admin System
        </div>
        <div className="absolute bottom-6 left-6 md:left-8 text-white">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            Admin Profile <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
          </h1>
          <p className="text-white/80 text-xs md:text-sm mt-1">Configure your personal information, contact credentials, and regional settings.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Panel: Profile Image & Summary */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-none shadow-md overflow-hidden bg-card/60 backdrop-blur-sm relative">
              <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
              <CardContent className="pt-8 pb-6 flex flex-col items-center text-center">
                <FormField
                  control={form.control}
                  name="profileImageUrl"
                  render={({ field }) => (
                    <FormItem className="relative z-10">
                      <FormControl>
                        <div className="p-1 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 shadow-lg">
                          <div className="bg-background rounded-full p-1">
                            <ProfileImageUploader
                              value={field.value || ''}
                              onChange={field.onChange}
                              className="w-32 h-32 rounded-full object-cover"
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="mt-4 space-y-1">
                  <h2 className="text-xl font-bold tracking-tight">{watchedName}</h2>
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    @{watchedUserName}
                  </p>
                  <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-500 dark:text-indigo-400">
                    <Shield className="h-3.5 w-3.5" />
                    System Admin
                  </div>
                </div>

                {currentUser?.email && (
                  <div className="mt-6 w-full pt-6 border-t flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 text-indigo-500" />
                    <span>{currentUser.email}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Tips or Info Card */}
            <Card className="border-none shadow-md bg-gradient-to-br from-indigo-900/5 to-purple-900/5 dark:from-indigo-950/10 dark:to-purple-950/10 border border-indigo-500/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="h-4 w-4" />
                  Profile Completeness
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                Ensure your details are accurate. A complete profile helps team members identify you and facilitates better collaboration on workspace projects.
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Detailed Settings Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Account Credentials & Personal Details */}
            <Card className="border-none shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <User className="h-5 w-5 text-indigo-500" />
                  Personal Information
                </CardTitle>
                <CardDescription>Verify and update your general account information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" className="focus-visible:ring-indigo-500" {...field} />
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
                        <FormLabel className="flex items-center gap-1.5">
                          <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                          Username
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your username" className="focus-visible:ring-indigo-500" {...field} />
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
                        <FormLabel className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          Phone Number
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your phone number" className="focus-visible:ring-indigo-500" {...field} />
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
                        <FormLabel className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          Date of Birth
                        </FormLabel>
                        <FormControl>
                          <Input type="date" className="focus-visible:ring-indigo-500" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          Bio / Summary
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about yourself, your skills, or role description..." 
                            className="resize-none min-h-[100px] focus-visible:ring-indigo-500" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Address & Regional Settings */}
            <Card className="border-none shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-purple-500" />
                  Address & Contact Details
                </CardTitle>
                <CardDescription>Configure your residential or business address settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          Address Line
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your street address" className="focus-visible:ring-indigo-500" {...field} />
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
                        <FormLabel className="flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5 text-muted-foreground" />
                          City
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your city" className="focus-visible:ring-indigo-500" {...field} />
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
                        <FormLabel className="flex items-center gap-1.5">
                          <Map className="h-3.5 w-3.5 text-muted-foreground" />
                          State / Province
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your state" className="focus-visible:ring-indigo-500" {...field} />
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
                        <FormLabel className="flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                          Country
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your country" className="focus-visible:ring-indigo-500" {...field} />
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
                        <FormLabel className="flex items-center gap-1.5">
                          <Compass className="h-3.5 w-3.5 text-muted-foreground" />
                          Pincode / ZIP Code
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your pincode" className="focus-visible:ring-indigo-500" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions Button Bar */}
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="px-6 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-200 transform hover:scale-[1.02] flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving changes...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
            
          </div>
        </form>
      </Form>
    </motion.div>
  );
}
