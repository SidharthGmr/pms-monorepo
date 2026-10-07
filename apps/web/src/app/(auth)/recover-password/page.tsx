import AuthLayout from '@/components/account/auth-layout';
import RecoverPasswordModule from '@/components/account/recover-password';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Forgot password - ${config.appName}`,
};

export default function RecoverPasswordPage() {
  return (
    <AuthLayout>
      <RecoverPasswordModule />
    </AuthLayout>
  );
}
