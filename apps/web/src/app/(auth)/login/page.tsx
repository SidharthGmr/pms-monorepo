import LoginModule from '@/components/account/login';
import AuthStaticLayout from '@/components/layout/authSimpleSlider';
export default function LoginPage() {
  return (
    <>
      <AuthStaticLayout formComponent={<LoginModule />} title="Welcome back" description="Use your credentials to sign in." />
    </>
  );
}
