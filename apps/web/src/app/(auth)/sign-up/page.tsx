import AuthLayout from '@/components/account/auth-layout';
import RegisterModule from '@/components/account/register';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Create your account - ${config.appName}`,
};

export default function SignUpPage() {
  return (
    <AuthLayout contentClassName="max-w-[520px]">
      <RegisterModule />
    </AuthLayout>
  );
}
