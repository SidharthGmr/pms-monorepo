'use client';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/components/ui/use-toast';
import { useResetPassword } from '@/hooks/service-hooks/useAccountService';
import { cn } from '@/lib/utils';
import ResetPasswordTokenSchema, { ResetPasswordFormModel } from '@/schema/ResetPasswordTokenSchema';
import { yupResolver } from '@hookform/resolvers/yup';
import { AlertTriangle, ArrowRight, Check, Eye, EyeOff, Lock, LockKeyhole } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AUTH_CONTROL, AUTH_FIELD, AUTH_FIELD_INVALID, AUTH_LABEL, AuthAltAction, AuthCard, AuthCardHeader, AuthDivider, AuthFootnote } from './auth-ui';

// Mirrors ResetPasswordTokenSchema so the checklist can never promise something validation then rejects.
const RULES: { label: string; test: (value: string) => boolean }[] = [
  { label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'One lowercase letter', test: (v) => /[a-z]/.test(v) },
  { label: 'One number', test: (v) => /\d/.test(v) },
  { label: 'One special character (@ $ ! % * ? &)', test: (v) => /[@$!%*?&]/.test(v) },
];

export default function ResetPasswordModule() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const resetPasswordMutation = useResetPassword();

  const form = useForm<ResetPasswordFormModel>({
    resolver: yupResolver(ResetPasswordTokenSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const { handleSubmit, control, reset, watch } = form;
  const newPassword = watch('newPassword') ?? '';
  const met = RULES.filter((rule) => rule.test(newPassword)).length;

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
      <AuthCard className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">This link is not valid</h1>
        <p className="mt-2 text-sm text-muted-foreground">The reset link is missing its token or was broken on the way here. Request a fresh one and it will arrive in a minute.</p>

        <div className="mt-6">
          <Button type="button" className="h-11 w-full gap-2 rounded-xl text-base shadow-lg shadow-primary/25" onClick={() => router.push('/recover-password')}>
            Request a new link
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <AuthDivider label="Or" />

        <AuthAltAction href="/login">Back to sign in</AuthAltAction>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthCardHeader eyebrow="Account recovery" title="Set a new password" description="Choose a password you have not used on this account before." icon={LockKeyhole} />

      <Form {...form}>
        <form autoComplete="off" onSubmit={handleSubmit(submitData)} className="mt-6 space-y-4">
          <FormField
            control={control}
            name="newPassword"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className={AUTH_LABEL}>New password</FormLabel>
                <FormControl>
                  <div className={cn(AUTH_FIELD, 'pr-1.5', fieldState.invalid && AUTH_FIELD_INVALID)}>
                    <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input type={showPassword ? 'text' : 'password'} placeholder="Enter a new password" autoComplete="new-password" className={AUTH_CONTROL} {...field} />
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

          <div className="rounded-xl border bg-muted/30 p-3">
            <div className="flex items-center gap-1.5">
              {RULES.map((rule, index) => (
                <span key={rule.label} className={cn('h-1 flex-1 rounded-full transition-colors', index < met ? 'bg-primary' : 'bg-border')} />
              ))}
            </div>
            <ul className="mt-3 grid gap-1.5">
              {RULES.map((rule) => {
                const ok = rule.test(newPassword);
                return (
                  <li key={rule.label} className={cn('flex items-center gap-2 text-xs transition-colors', ok ? 'text-foreground' : 'text-muted-foreground')}>
                    <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full', ok ? 'bg-primary text-primary-foreground' : 'bg-border')}>
                      {ok && <Check className="h-2.5 w-2.5" />}
                    </span>
                    {rule.label}
                  </li>
                );
              })}
            </ul>
          </div>

          <FormField
            control={control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className={AUTH_LABEL}>Confirm password</FormLabel>
                <FormControl>
                  <div className={cn(AUTH_FIELD, fieldState.invalid && AUTH_FIELD_INVALID)}>
                    <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input type={showPassword ? 'text' : 'password'} placeholder="Repeat the new password" autoComplete="new-password" className={AUTH_CONTROL} {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" size="lg" className="h-11 w-full gap-2 rounded-xl text-base shadow-lg shadow-primary/25" loading={isLoading} disabled={isLoading}>
            {isLoading ? 'Saving…' : 'Reset password'}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>
      </Form>

      <AuthDivider label="Remembered it" />

      <AuthAltAction href="/login">Back to sign in</AuthAltAction>

      <AuthFootnote>You will be asked to sign in again once the new password is saved.</AuthFootnote>
    </AuthCard>
  );
}
