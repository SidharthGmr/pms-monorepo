'use client';

import GreetingHeader from '@/components/common/greeting-header';
import PurchasePage from '@/components/features/pos';
import UserListingWrapper from '@/components/features/users/listing-wrapper';
import { CardDescription } from '@/components/ui/card';
import { Roles } from '@/enums/roles.enum';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  if (status === 'loading') {
    return <CardDescription className="p-6 text-sm text-muted-foreground">Loading dashboard...</CardDescription>;
  }

  if (status === 'unauthenticated') {
    return <CardDescription className="p-6 text-sm text-muted-foreground">Redirecting...</CardDescription>;
  }

  const role = (session?.user as any)?.role;

  return (

    < div className="max-w-7xl mx-auto space-y-8" >
      <GreetingHeader />
      {role === Roles.STAFF && <PurchasePage />}
      {role === Roles.USER && <UserListingWrapper />}
    </div >
  );
}
