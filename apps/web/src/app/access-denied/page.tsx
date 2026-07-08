import config from '@/config';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `Access Denied - ${config.appName}`,
};

export default async function AccessDeniedPage() {
  return (
    <>
      <div className="flex items-center justify-center h-screen">
        <div className="w-full max-w-xl items-center">
          <div className="flex justify-center mb-4">
            <Link href="/">
              <Image src={`${config.cdnUrl}/images/logo.svg`} alt={`${config.appName}`} width="220" height="0" className="m-auto h-auto" priority />
            </Link>
          </div>
          <div className="col flex flex-col justify-center items-center mt-2">
            <h1 className="text-3xl font-extrabold text-destructive mb-3 mt-3">Access Denied!</h1>
            <p className="text-muted-gray text-md mb-6 text-center">You are not authorized to access this page!</p>
          </div>
        </div>
      </div>
    </>
  );
}
