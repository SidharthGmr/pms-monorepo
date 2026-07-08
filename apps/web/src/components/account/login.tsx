'use client';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { UserDto } from '@/dtos/UserDto';
import { useRoleRedirect } from '@/hooks/use-role-base-redirection';
import { LoginModel } from '@/models/login.model';
import LoginSchema from '@/schema/LoginSchema';
import { yupResolver } from '@hookform/resolvers/yup';
import { getSession, signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FaArrowUpRightFromSquare } from 'react-icons/fa6';
import { CardDescription } from '../ui/card';

export default function LoginModule() {
  const { data: session, status } = useSession();
  const { redirectToRoleBasedDashboard } = useRoleRedirect();
  const router = useRouter();
  const [showLoader, setShowLoader] = useState<boolean>(false);

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
    toast({
      variant: 'destructive',
      title: 'Error',
      description: <span>Invalid username or password</span>,
    });
  };

  return (
    <div className="">
      <Form {...form}>
        <form autoComplete="off" onSubmit={handleSubmit(submitData)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address*</FormLabel>
                <FormControl>
                  <Input placeholder="name@example.com" {...field} className="" />
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
                <FormLabel>Password*</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter your password" {...field} className="" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* <div className="flex items-center justify-between">
            <Link href="/recover-password" className="text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors">
              Forgot Password?
            </Link>
          </div> */}

          <Button
            type="submit"
            icon={FaArrowUpRightFromSquare}
            iconPlacement="right"
            className="w-full transition-all duration-300 hover:scale-[1.02]"
            loading={showLoader}
          >
            {showLoader ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </Form>

      <div className="my-4 text-center">
        <CardDescription>
          Don&apos;t have an account?
          <Link href="/sign-up" className="font-medium text-blue-500 hover:text-blue-400 transition-colors ms-1">
            Sign up now
          </Link>
        </CardDescription>
      </div>
    </div>
  );
}
