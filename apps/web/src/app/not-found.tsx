import { Metadata } from 'next';
import config from '@/config';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import Logo from '@/components/common/Logo';

export const metadata: Metadata = {
  title: `Page Not Found - ${config.appName}`,
};

export default function NotFound() {
  return (
    <>
      <div className="grid grid-cols-8 gap-4  place-content-center h-screen bg-accent">
        <div className="col-start-0 col-span-8 lg:col-start-2 lg:col-span-6 2xl:col-start-3 2xl:col-span-4 text-center px-5 md:px-16 lg:px-0">
          <div className="text-center inline-block mb-5">
            <Logo width={300} logoType="logo" />
          </div>

          <Card className="bg-card p-5 lg:p-16 rounded-sm">
            <CardTitle className="text-3xl font-bold my-4 text-primary">Page Not Found</CardTitle>
            <CardDescription className="font-semibold mb-6">Oops! Looks Like The Page You're Looking For Never Existed Or Was Moved.</CardDescription>
          </Card>
        </div>
      </div>
    </>
  );
}
