'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Link from 'next/link';
import { Mail, MailCheck } from 'lucide-react';
import { FaArrowUpRightFromSquare } from 'react-icons/fa6';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { CardDescription } from '@/components/ui/card';
import ForgotPasswordModel from '@/models/ForgotPasswordModel';
import ForgotPasswordSchema from '@/schema/ForgotPasswordSchema';
import { useForgotPassword } from '@/hooks/service-hooks/useAccountService';

export default function RecoverPasswordModule() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const forgotPasswordMutation = useForgotPassword();

  const form = useForm<ForgotPasswordModel>({
    resolver: yupResolver(ForgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const { handleSubmit, control } = form;

  const submitData = async (data: ForgotPasswordModel) => {
    setIsLoading(true);
    try {
      const response = await forgotPasswordMutation.mutateAsync(data);
      if (response && (response.status === 200 || response.status === 201) && response.data?.success) {
        setSentEmail(data.email);
        setSent(true);
      } else {
        toast({
          variant: 'destructive',
          description: response?.data?.message || 'Could not send the reset link. Please try again.',
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

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <MailCheck className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Check your email</h2>
          <p className="text-sm text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{sentEmail}</span>, a password reset link is on
            its way. The link expires in 1 hour.
          </p>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Back to Sign in</Link>
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address*</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="name@example.com" icon={Mail} {...field} />
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
            {isLoading ? 'Sending...' : 'Send reset link'}
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
