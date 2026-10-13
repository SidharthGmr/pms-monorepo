'use client';

import GreetingHeader from '@/components/common/greeting-header';
import CustomerDashboard from '@/components/features/customer-dashboard';
import PublicVariantList from '@/components/features/public-variants';
import ShopPage from '@/components/features/shop';
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
    <div className="max-w-7xl mx-auto space-y-8">
      {role === Roles.STAFF && (
        <>
          <GreetingHeader />
          <PublicVariantList />
        </>
      )}
      {/* A customer lands on their own overview - orders, cart, wishlist, profile - with the shop below it. */}
      {role === Roles.USER && (
        <>
          <CustomerDashboard />
          <section className="space-y-4 border-t pt-6">
            <div>
              <h2 className="text-lg font-bold">Continue shopping</h2>
              <p className="text-sm text-muted-foreground">Browse the catalog and add to your cart.</p>
            </div>
            <ShopPage />
          </section>
        </>
      )}
    </div>
  );
}
