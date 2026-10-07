'use client';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/components/ui/use-toast';
import { useForgotPassword } from '@/hooks/service-hooks/useAccountService';
import { cn } from '@/lib/utils';
import ForgotPasswordModel from '@/models/ForgotPasswordModel';
import ForgotPasswordSchema from '@/schema/ForgotPasswordSchema';
import { yupResolver } from '@hookform/resolvers/yup';
import { ArrowRight, KeyRound, Mail, MailCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AUTH_CONTROL, AUTH_FIELD, AUTH_FIELD_INVALID, AUTH_LABEL, AuthAltAction, AuthCard, AuthCardHeader, AuthDivider, AuthFootnote } from './auth-ui';

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

  // The link is sent whether or not the address is registered, so this screen never confirms an account exists.
  if (sent) {
    return (
      <AuthCard className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MailCheck className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          If an account exists for <span className="font-semibold text-foreground">{sentEmail}</span>, a reset link is on its way. It expires in one hour.
        </p>

        <div className="mt-6 rounded-xl border bg-muted/30 px-4 py-3 text-left text-xs text-muted-foreground">
          Nothing in your inbox after a minute? Check the spam folder, then send the link again.
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => setSent(false)}>
            Use another email
          </Button>
          <Button type="button" className="h-11 rounded-xl shadow-lg shadow-primary/25" loading={isLoading} disabled={isLoading} onClick={() => submitData({ email: sentEmail })}>
            {isLoading ? 'Sending…' : 'Resend link'}
          </Button>
        </div>

        <AuthDivider label="Done here" />

        <AuthAltAction href="/login">Back to sign in</AuthAltAction>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthCardHeader eyebrow="Account recovery" title="Forgot your password?" description="Give us the email on your account and we'll send a link to set a new password." icon={KeyRound} />

      <Form {...form}>
        <form autoComplete="off" onSubmit={handleSubmit(submitData)} className="mt-6 space-y-4">
          <FormField
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className={AUTH_LABEL}>Email address</FormLabel>
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

          <Button type="submit" size="lg" className="h-11 w-full gap-2 rounded-xl text-base shadow-lg shadow-primary/25" loading={isLoading} disabled={isLoading}>
            {isLoading ? 'Sending…' : 'Send reset link'}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>
      </Form>

      <AuthDivider label="Remembered it" />

      <AuthAltAction href="/login">Back to sign in</AuthAltAction>

      <AuthFootnote>For your security the link works once and expires in one hour.</AuthFootnote>
    </AuthCard>
  );
}
