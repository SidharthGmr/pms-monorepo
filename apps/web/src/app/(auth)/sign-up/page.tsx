import RegisterModule from '@/components/account/register';
import AuthStaticLayout from '@/components/layout/authSimpleSlider';
export default function Page() {
  return (
    <>
      <AuthStaticLayout formComponent={<RegisterModule />} title="Create your account" />
    </>
  );
}
