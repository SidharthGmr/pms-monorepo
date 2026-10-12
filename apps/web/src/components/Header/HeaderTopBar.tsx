'use client';
import { BRAND } from '@/data/theme.config';
import { dashboardPathFor } from '@/hooks/use-role-base-redirection';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Phone } from 'lucide-react';
import Link from 'next/link';
interface Propstype {
  cssClassNames?: string;
}

// The session is only known on the client, so the account link renders a fixed-width placeholder
// until it is: showing "Log in" first and swapping it for "Dashboard" a beat later reads as a
// glitch to anyone who is already signed in.
export default function HeaderTopBar({ cssClassNames }: Propstype) {
  const { currentUser, status, isAuthenticated } = useGetCurrentUser();
  const dashboardHref = dashboardPathFor(currentUser?.role ? [currentUser.role] : []);
  return (
    <>
      <div className={cn('hidden border-b border-border bg-muted/40 py-1.5 text-xs text-muted-foreground md:block', cssClassNames)}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <span>{BRAND.utilityMessage}</span>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              Call for order: {BRAND.phone}
            </span>
            {status === 'loading' ? (
              <span aria-hidden className="h-3.5 w-24 animate-pulse rounded bg-muted-foreground/20" />
            ) : isAuthenticated ? (
              <Link href={dashboardHref} className="flex items-center gap-1.5 font-medium hover:text-foreground">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="font-medium hover:text-foreground">
                Log in / Sign up
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
