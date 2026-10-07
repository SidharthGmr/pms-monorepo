'use client';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { cn } from '@/lib/utils';
import { CreateUserModel } from '@/models/user.model';
import SignupSchema from '@/schema/userSchema';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { yupResolver } from '@hookform/resolvers/yup';
import { ArrowRight, Eye, EyeOff, Lock, Mail, Phone, Store, User, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AUTH_CONTROL, AUTH_FIELD, AUTH_FIELD_INVALID, AUTH_LABEL, AuthAltAction, AuthCard, AuthCardHeader, AuthDivider, AuthFootnote } from './auth-ui';

export default function RegisterModule() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  const form = useForm<CreateUserModel>({
    resolver: yupResolver(SignupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      isRegisterbyShop: false,
    },
  });

  const { handleSubmit, control } = form;

  const submitData = async (data: CreateUserModel) => {
    try {
      setIsLoading(true);
      // Goes through AccountService so the request carries the clientId header the
      // API gates every route on; a raw fetch() here silently 401s in production,
      // where SITE_MODE no longer waives that gate.
      const response = await unitOfService.AccountService.createUser(data);

      if (response && response.data?.success) {
        form.reset();

        toast({
          title: 'Success',
          description: 'Registered successfully!',
          variant: 'success',
        });

        router.push('/login/');
      } else {
        throw new Error(response?.data?.message || 'Failed to save data');
      }
    } catch (error) {
      console.error('Error saving data:', error);

      toast({
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'Failed to create account. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard>
      <AuthCardHeader eyebrow="Get started" title="Create your account" description="A few details and your store workspace is ready to use." icon={UserPlus} />

      <Form {...form}>
        <form autoComplete="off" onSubmit={handleSubmit(submitData)} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name="firstName"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className={AUTH_LABEL}>First name</FormLabel>
                  <FormControl>
                    <div className={cn(AUTH_FIELD, fieldState.invalid && AUTH_FIELD_INVALID)}>
                      <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <input type="text" placeholder="John" autoComplete="given-name" className={AUTH_CONTROL} {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="lastName"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className={AUTH_LABEL}>Last name</FormLabel>
                  <FormControl>
                    <div className={cn(AUTH_FIELD, fieldState.invalid && AUTH_FIELD_INVALID)}>
                      <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <input type="text" placeholder="Doe" autoComplete="family-name" className={AUTH_CONTROL} {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className={AUTH_LABEL}>Business email</FormLabel>
                <FormControl>
                  <div className={cn(AUTH_FIELD, fieldState.invalid && AUTH_FIELD_INVALID)}>
                    <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input type="email" placeholder="name@company.com" autoComplete="email" inputMode="email" className={AUTH_CONTROL} {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="phone"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className={AUTH_LABEL}>Phone</FormLabel>
                <FormControl>
                  <div className={cn(AUTH_FIELD, fieldState.invalid && AUTH_FIELD_INVALID)}>
                    <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input type="tel" placeholder="(555) 000-0000" autoComplete="tel" inputMode="tel" className={AUTH_CONTROL} {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className={AUTH_LABEL}>Password</FormLabel>
                <FormControl>
                  <div className={cn(AUTH_FIELD, 'pr-1.5', fieldState.invalid && AUTH_FIELD_INVALID)}>
                    <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input type={showPassword ? 'text' : 'password'} placeholder="Create a password" autoComplete="new-password" className={AUTH_CONTROL} {...field} />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="isRegisterbyShop"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3 rounded-xl border bg-muted/30 px-3 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Store className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <FormLabel className="!mt-0 text-sm font-semibold">Register as a shop</FormLabel>
                  <p className="text-xs text-muted-foreground">Turn this on to open your own store instead of joining one.</p>
                </div>
                <FormControl>
                  <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <Button type="submit" size="lg" className="h-11 w-full gap-2 rounded-xl text-base shadow-lg shadow-primary/25" loading={isLoading} disabled={isLoading}>
            {isLoading ? 'Creating account…' : 'Create account'}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>
      </Form>

      <AuthDivider label="Already registered" />

      <AuthAltAction href="/login">Sign in instead</AuthAltAction>

      <AuthFootnote>By creating an account you agree to our terms of service and privacy policy.</AuthFootnote>
    </AuthCard>
  );
}
