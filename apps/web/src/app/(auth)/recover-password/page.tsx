import RecoverPasswordModule from '@/components/account/recover-password';
import AuthStaticLayout from '@/components/layout/authSimpleSlider';

export default function RecoverPasswordPage() {
  return (
    <>
      <AuthStaticLayout
        formComponent={<RecoverPasswordModule />}
        title="Forgot password"
        description="Enter your email and we'll send you a link to reset your password."
      />
    </>
  );
}
