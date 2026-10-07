import AuthLayout from '@/components/account/auth-layout';
import LoginModule from '@/components/account/login';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Sign in - ${config.appName}`,
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginModule />
    </AuthLayout>
  );
}
