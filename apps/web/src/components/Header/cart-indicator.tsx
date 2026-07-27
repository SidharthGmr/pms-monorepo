'use client';

import { Button } from '@/components/ui/button';
import { useGetActiveCart } from '@/hooks/service-hooks/useCartService';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Top-bar cart button with a live item count, so the cart is reachable from every
 * admin/dashboard page. Shares the `CartService.getActive` query key with the cart
 * page and POS, so a mutation anywhere updates this badge too.
 */
export function CartIndicator() {
  const pathname = usePathname();

  const isDashboard = pathname?.startsWith('/dashboard') ?? false;
  const isAdmin = pathname?.startsWith('/admin') ?? false;
  const hasCart = isAdmin || isDashboard;

  // This header is also used by the super-admin layout, which has no cart, so skip
  // the request entirely there rather than fetching and rendering nothing.
  const { data: cartResponse } = useGetActiveCart(undefined, hasCart);

  const totalQuantity = cartResponse?.data?.data?.totalQuantity ?? 0;

  if (!hasCart) return null;

  // /admin and /dashboard are role-gated in middleware.ts, so stay in the current area.
  const cartHref = isDashboard ? '/dashboard/cart' : '/admin/cart';

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="relative h-9 w-9"
      title={totalQuantity > 0 ? `Cart - ${totalQuantity} item${totalQuantity === 1 ? '' : 's'}` : 'Cart is empty'}
    >
      <Link href={cartHref} aria-label={totalQuantity > 0 ? `Cart, ${totalQuantity} items` : 'Cart, empty'}>
        <ShoppingCart className="h-[18px] w-[18px]" />
        {totalQuantity > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
            {totalQuantity > 99 ? '99+' : totalQuantity}
          </span>
        )}
      </Link>
    </Button>
  );
}
