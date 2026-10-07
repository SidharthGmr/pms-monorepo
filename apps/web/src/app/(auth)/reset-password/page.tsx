import AuthLayout from '@/components/account/auth-layout';
import ResetPasswordModule from '@/components/account/reset-password';
import config from '@/config';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: `Reset password - ${config.appName}`,
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-svh" />}>
      <AuthLayout>
        <ResetPasswordModule />
      </AuthLayout>
    </Suspense>
  );
}
