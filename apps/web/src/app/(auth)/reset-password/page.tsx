import { Suspense } from 'react';
import { Metadata } from 'next';
import config from '@/config';
import ResetPasswordModule from '@/components/account/reset-password';
import AuthStaticLayout from '@/components/layout/authSimpleSlider';

export const metadata: Metadata = {
  title: `Reset Password - ${config.appName}`,
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AuthStaticLayout
        formComponent={<ResetPasswordModule />}
        title="Reset password"
        description="Choose a new password for your account."
      />
    </Suspense>
  );
}
