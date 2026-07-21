import { Suspense } from 'react';
import { Metadata } from 'next';
import config from '@/config';
import VerifyEmailModule from '@/components/account/verify-email';

export const metadata: Metadata = {
  title: `Verify Email - ${config.appName}`,
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <VerifyEmailModule />
    </Suspense>
  );
}
