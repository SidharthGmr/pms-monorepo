'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, Lock } from 'lucide-react';
import { FaArrowUpRightFromSquare } from 'react-icons/fa6';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { CardDescription } from '@/components/ui/card';
import ResetPasswordTokenSchema, { ResetPasswordFormModel } from '@/schema/ResetPasswordTokenSchema';
import { useResetPassword } from '@/hooks/service-hooks/useAccountService';

export default function ResetPasswordModule() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);

  const resetPasswordMutation = useResetPassword();

  const form = useForm<ResetPasswordFormModel>({
    resolver: yupResolver(ResetPasswordTokenSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const { handleSubmit, control, reset } = form;

  const submitData = async (data: ResetPasswordFormModel) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await resetPasswordMutation.mutateAsync({
        token,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      if (response && (response.status === 200 || response.status === 201) && response.data?.success) {
        toast({
          variant: 'success',
          description: response.data.message || 'Password reset successfully!',
        });
        reset();
        router.push('/login');
      } else {
        toast({
          variant: 'destructive',
          description: response?.data?.message || 'Could not reset your password. The link may have expired.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Invalid reset link</h2>
          <p className="text-sm text-muted-foreground">
            This password reset link is missing its token or is malformed. Please request a new one.
          </p>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href="/recover-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Form {...form}>
        <form autoComplete="off" onSubmit={handleSubmit(submitData)} className="space-y-6">
          <FormField
            control={control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password*</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter new password" icon={Lock} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password*</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Confirm new password" icon={Lock} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            icon={FaArrowUpRightFromSquare}
            iconPlacement="right"
            className="w-full transition-all duration-300 hover:scale-[1.02]"
            loading={isLoading}
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </Form>

      <div className="my-4 text-center">
        <CardDescription>
          Remember your password?
          <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors ms-1">
            Sign in
          </Link>
        </CardDescription>
      </div>
    </div>
  );
}
