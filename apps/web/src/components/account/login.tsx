'use client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { useRoleRedirect } from '@/hooks/use-role-base-redirection';
import { LoginModel } from '@/models/login.model';
import LoginSchema from '@/schema/LoginSchema';
import { yupResolver } from '@hookform/resolvers/yup';
import { UserDto } from '@pms/types';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { getSession, signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

export default function LoginModule() {
  const { data: session, status } = useSession();
  const { redirectToRoleBasedDashboard } = useRoleRedirect();
  const router = useRouter();
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginModel>({
    resolver: yupResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { handleSubmit } = form;

  // Redirect to role-based dashboard if user is already logged in
  useEffect(() => {
    if (session && session?.user?.role) {
      const roles = session?.user?.role ? [session?.user?.role] : [];
      redirectToRoleBasedDashboard(roles);
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if (typeof window !== 'undefined') {
        const user: UserDto = session?.user as UserDto;
        localStorage.setItem('at', user.token || '');
        localStorage.setItem('fullName', user.name || '');
        localStorage.setItem('profilePicture', user.profileImageUrl || '');
      }
    }
  }, [status, session]);

  const submitData = async (model: LoginModel) => {
    setShowLoader(true);

    const loginStatus = await signIn('credentials', {
      email: model.email,
      password: model.password,
      redirect: false,
      callbackUrl: '/',
    });

    if (loginStatus && loginStatus.ok && !loginStatus.error) {
      toast({
        variant: 'success',
        title: 'Login successful',
        description: <span>Redirecting to your dashboard...</span>,
      });

      const checkSessionAndRedirect = async () => {
        const maxRetries = 10;
        let retries = 0;

        while (retries < maxRetries) {
          const currentSession = await getSession();
          const user = currentSession?.user as UserDto;

          if (user && user.role) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('at', user.token || '');
              localStorage.setItem('fullName', user.name || '');
              localStorage.setItem('profilePicture', user.profileImageUrl || (session?.user as any)?.image || '');
            }

            redirectToRoleBasedDashboard([user.role]);
            return;
          }

          retries++;
          await new Promise((res) => setTimeout(res, 200));
        }

        // Fallback
        setShowLoader(false);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: <span>Failed to retrieve user session</span>,
        });
      };

      await checkSessionAndRedirect();
      return;
    }
    setShowLoader(false);

    // `authorize()` throws the API's own message and NextAuth hands it back here, so this
    // shows what the backend actually said rather than a fixed string.
    toast({
      variant: 'destructive',
      title: 'Error',
      description: <span>{loginStatus?.error || 'Invalid username or password. Please try again.'}</span>,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Welcome back</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Sign in with your work email to open your store.</p>
      </div>

      <Form {...form}>
        <form autoComplete="off" onSubmit={handleSubmit(submitData)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Email address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="name@company.com" autoComplete="email" inputMode="email" icon={Mail} className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium">Password</FormLabel>
                  <Link href="/recover-password" className="text-xs font-medium text-primary underline-offset-4 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input type={showPassword ? 'text' : 'password'} placeholder="Your password" autoComplete="current-password" icon={Lock} className="h-11 pr-11" {...field} />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <Checkbox />
            Keep me signed in on this device
          </label>

          <Button type="submit" size="lg" className="h-11 w-full gap-2 text-base" loading={showLoader} disabled={showLoader}>
            {showLoader ? 'Signing in…' : 'Sign in'}
            {!showLoader && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        New to the store?{' '}
        <Link href="/sign-up" className="font-semibold text-primary underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>

      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">By signing in you agree to our terms of service and privacy policy.</p>
    </div>
  );
}
