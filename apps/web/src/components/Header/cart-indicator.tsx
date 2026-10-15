'use client';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetActiveCart, useRemoveCartVariant, useUpdateCartVariantQuantity } from '@/hooks/service-hooks/useCartService';
import { useLocale } from '@/i18n/locale-provider';
import { cn } from '@/lib/utils';
import { CartItemDto } from '@pms/types';
import { ArrowRight, ImageOff, Minus, Plus, ShoppingCart, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

/**
 * Top-bar cart, opened in place like the notification bell rather than navigating away: the
 * panel shows the lines, lets quantities change and lines go, and only the footer buttons leave
 * the page. Shares the `CartService.getActive` query key with the cart page and POS, so a
 * mutation anywhere updates the badge and panel together.
 */
export function CartIndicator() {
  const pathname = usePathname();
  const { t, formatCurrency } = useLocale();
  const [open, setOpen] = useState(false);

  const isDashboard = pathname?.startsWith('/dashboard') ?? false;
  const isAdmin = pathname?.startsWith('/admin') ?? false;
  const hasCart = isAdmin || isDashboard;

  // This header is also used by the super-admin layout, which has no cart, so skip
  // the request entirely there rather than fetching and rendering nothing.
  const { data: cartResponse, isLoading } = useGetActiveCart(hasCart);
  const updateQuantity = useUpdateCartVariantQuantity();
  const removeVariant = useRemoveCartVariant();

  const cart = cartResponse?.data?.data;
  const items: CartItemDto[] = cart?.items ?? [];
  const totalQuantity = cart?.totalQuantity ?? 0;

  if (!hasCart) return null;

  // /admin and /dashboard are role-gated in middleware.ts, so stay in the current area.
  const base = isDashboard ? '/dashboard' : '/admin';
  const busy = updateQuantity.isPending || removeVariant.isPending;

  const setQuantity = (item: CartItemDto, quantity: number) => {
    if (quantity < 1) return;
    updateQuantity.mutate({ variantId: item.variantId, model: { quantity } });
  };

  const badgeTitle =
    totalQuantity === 0 ? t('cart.badgeTitleNone') : totalQuantity === 1 ? t('cart.badgeTitleOne') : t('cart.badgeTitle', { count: totalQuantity });

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9" title={badgeTitle} aria-label={badgeTitle}>
          <ShoppingCart className="h-[18px] w-[18px]" />
          {totalQuantity > 0 && (
            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
              {totalQuantity > 99 ? '99+' : totalQuantity}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} collisionPadding={8} className="w-[calc(100vw-1.5rem)] max-w-[22rem] rounded-lg p-0 sm:w-[22rem]">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <p className="text-sm font-semibold">
            {t('cart.title')}
            {items.length > 0 && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                {items.length === 1 ? t('cart.countLineOne') : t('cart.countLine', { count: items.length })}
              </span>
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-3" aria-busy="true">
            {[0, 1].map((row) => (
              <div key={row} className="flex gap-3">
                <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <ShoppingCart className="mx-auto h-7 w-7 text-muted-foreground/40" />
            <p className="mt-2 text-sm font-medium">{t('cart.empty')}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t('cart.emptyHint')}</p>
          </div>
        ) : (
          <>
            <div className="max-h-[50vh] overflow-y-auto overscroll-contain sm:max-h-[19rem]">
              <ul className="divide-y">
                {items.map((item) => (
                  <li key={item.id} className="group relative flex gap-3 px-3 py-2.5 pr-9">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
                      {item.productImages?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.productImages[0]} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageOff className="h-4 w-4 text-muted-foreground/50" />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium leading-tight" title={item.productName}>
                        {item.productName}
                      </span>
                      {item.variantName && <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{item.variantName}</span>}

                      <span className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center rounded-md border">
                          <button
                            type="button"
                            onClick={() => setQuantity(item, item.quantity - 1)}
                            disabled={busy || item.quantity <= 1}
                            aria-label={t('cart.decrease')}
                            className="flex h-6 w-6 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="min-w-6 px-1 text-center text-xs font-semibold tabular-nums">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(item, item.quantity + 1)}
                            disabled={busy}
                            aria-label={t('cart.increase')}
                            className="flex h-6 w-6 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </span>
                        <span className="text-xs font-semibold tabular-nums">{formatCurrency(item.lineTotal ?? 0, cart?.currency || 'INR')}</span>
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={() => removeVariant.mutate(item.variantId)}
                      disabled={busy}
                      aria-label={t('cart.remove')}
                      title={t('cart.remove')}
                      className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus:opacity-100 group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t p-3">
              <div className="mb-2.5 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('cart.subtotal')}</span>
                <span className={cn('font-semibold tabular-nums', busy && 'opacity-60')}>
                  {formatCurrency(cart?.charges?.subtotal ?? cart?.totalAmount ?? 0, cart?.currency || 'INR')}
                </span>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`${base}/cart`} onClick={() => setOpen(false)}>
                    {t('cart.viewCart')}
                  </Link>
                </Button>
                <Button asChild size="sm" className="flex-1 gap-1.5">
                  <Link href={`${base}/checkout`} onClick={() => setOpen(false)}>
                    {t('cart.checkout')}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
