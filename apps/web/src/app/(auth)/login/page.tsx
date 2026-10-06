import LoginModule from '@/components/account/login';
import LoginLayout from '@/components/account/login-layout';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Sign in - ${config.appName}`,
};

export default function LoginPage() {
  return (
    <LoginLayout>
      <LoginModule />
    </LoginLayout>
  );
}
