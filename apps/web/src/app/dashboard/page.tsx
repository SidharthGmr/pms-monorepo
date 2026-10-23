'use client';

import GreetingHeader from '@/components/common/greeting-header';
import CustomerDashboard from '@/components/features/customer-dashboard';
import CustomerDashboardSkeleton from '@/components/features/customer-dashboard/dashboard-skeleton';
import PublicVariantList from '@/components/features/public-variants';
import { CardDescription } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Roles } from '@pms/types';

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="max-w-7xl mx-auto">
        <CustomerDashboardSkeleton />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <CardDescription className="p-6 text-sm text-muted-foreground">Redirecting...</CardDescription>;
  }

  const role = (session?.user as any)?.role;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {role === Roles.STAFF && (
        <>
          <GreetingHeader />
          <PublicVariantList />
        </>
      )}
      {/* A customer lands on their own overview - orders, returns, cart, wishlist, profile - with the shop below it. */}
      {role === Roles.USER && (
        <>
          <CustomerDashboard />
        </>
      )}
    </div>
  );
}
