'use client';

import StatusBadge from '@/components/common/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderDto } from '@/dtos/order.dto';
import { OrderStatus } from '@/enums/order-status.enum';
import { useGetActiveCart } from '@/hooks/service-hooks/useCartService';
import { useGetOrdersByCustomerId } from '@/hooks/service-hooks/useOrderService';
import { useGetAllReviews } from '@/hooks/service-hooks/useReviewService';
import { useGetUserById } from '@/hooks/service-hooks/useUserList.service.hook';
import { useGetAllWishlists } from '@/hooks/service-hooks/useWishlistService';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { UserDto } from '@pms/types';
import { format } from 'date-fns';
import { CalendarDays, ChevronRight, Heart, LucideIcon, Mail, MapPin, Package, Pencil, Phone, Receipt, ShoppingCart, Star, Wallet } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ReactNode, useMemo, useState } from 'react';
import { toneFor } from '../orders/order-status';

const COLLAPSED_COUNT = 6;

// Cancelled and returned orders are not money spent, so they stay out of the total.
const UNSPENT = new Set<string>([OrderStatus.Cancelled, OrderStatus.Returned]);

const initials = (name?: string | null) =>
  (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('') || '?';

function StatTile({ icon: Icon, label, value, hint, href, loading }: { icon: LucideIcon; label: string; value: ReactNode; hint?: string; href?: string; loading?: boolean }) {
  const body = (
    <Card className={cn('!p-4 h-full', href && 'transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          {loading ? <Skeleton className="mt-1.5 h-7 w-16" /> : <p className="mt-0.5 truncate text-2xl font-bold tabular-nums">{value}</p>}
          {hint && <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>}
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </Card>
  );
  return href ? (
    <Link href={href} className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {body}
    </Link>
  ) : (
    body
  );
}

function OrderRow({ order }: { order: OrderDto }) {
  const quantity = (order.items ?? []).reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  const placed = order.createdAt ? format(new Date(order.createdAt), 'dd MMM yyyy') : '—';

  return (
    <Link
      href={`/dashboard/orders/${order.id}`}
      className="group flex items-center gap-3 px-4 py-3 outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 sm:px-5"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Package className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-mono text-xs font-semibold sm:text-sm">{order.orderNumber}</p>
          <StatusBadge status={order.status} tone={toneFor(order.status)} size="xs" />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {placed} · {quantity} {quantity === 1 ? 'item' : 'items'}
        </p>
      </div>
      <p className="shrink-0 text-sm font-semibold tabular-nums">{formatPrice(order.grandTotal ?? 0)}</p>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value?: ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="w-20 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate font-medium">{value}</span>
    </div>
  );
}

/**
 * The signed-in customer's home: their orders, what they have saved and who they are.
 * Every number is their own - the API pins a plain customer to their own rows, and the
 * queries wait for the session so the first request is never the unscoped one.
 */
export default function CustomerDashboard() {
  const { currentUser } = useGetCurrentUser();
  const userId = currentUser?.usersId;

  const ordersQuery = useGetOrdersByCustomerId(userId ?? '', undefined, !!userId);
  const profileQuery = useGetUserById(userId ?? '', !!userId);
  const wishlistQuery = useGetAllWishlists({ userId, page: 1, recordPerPage: 1 }, !!userId);
  const reviewsQuery = useGetAllReviews({ userId, page: 1, recordPerPage: 1 }, !!userId);
  const cartQuery = useGetActiveCart(!!userId);

  const [showAll, setShowAll] = useState(false);

  // The customer endpoint already returns newest first, so the first row is the latest order.
  const orders = useMemo<OrderDto[]>(() => ordersQuery.data?.data?.data?.data ?? [], [ordersQuery.data]);
  const totalSpent = useMemo(() => orders.filter((order) => !UNSPENT.has(String(order.status))).reduce((sum, order) => sum + (order.grandTotal ?? 0), 0), [orders]);

  const profile = profileQuery.data?.data?.data as UserDto | undefined;
  const wishlistCount = wishlistQuery.data?.data?.data?.totalRecord ?? 0;
  const reviewCount = reviewsQuery.data?.data?.data?.totalRecord ?? 0;
  const cartItems = cartQuery.data?.data?.data?.items ?? [];
  const cartQuantity = cartItems.reduce((sum, item) => sum + (item.quantity ?? 0), 0);

  const name = profile?.name || currentUser?.name || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const visibleOrders = showAll ? orders : orders.slice(0, COLLAPSED_COUNT);

  return (
    <div className="space-y-5">
      {/* Greeting - the customer's own, with links that stay inside /dashboard. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting}, <span className="capitalize">{name}</span>!
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Here&apos;s where your orders and saved items stand.</p>
        </div>
        <Button asChild size="sm" variant="outline" className="w-fit gap-1.5">
          <Link href="/dashboard/edit-profile">
            <Pencil className="h-3.5 w-3.5" />
            Edit profile
          </Link>
        </Button>
      </div>

      {/* The four numbers that matter to a shopper, each opening its own page. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={Receipt} label="My orders" value={orders.length} hint={orders[0] ? `Last on ${format(new Date(orders[0].createdAt), 'dd MMM')}` : 'No orders yet'} loading={ordersQuery.isPending} />
        <StatTile icon={Wallet} label="Total spent" value={formatPrice(totalSpent)} hint="Across delivered and open orders" loading={ordersQuery.isPending} />
        <StatTile icon={ShoppingCart} label="In cart" value={cartQuantity} hint={cartQuantity > 0 ? 'Ready to check out' : 'Your cart is empty'} href="/dashboard/cart" loading={cartQuery.isPending} />
        <StatTile icon={Heart} label="Wishlist" value={wishlistCount} hint={wishlistCount > 0 ? 'Saved for later' : 'Nothing saved yet'} href="/dashboard/wishlist" loading={wishlistQuery.isPending} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* The ordered list, newest first. */}
        <Card className="!p-0 overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5">
            <div>
              <h2 className="text-sm font-semibold">My orders</h2>
              <p className="text-xs text-muted-foreground">Latest first - open one for its items and bill</p>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">{orders.length}</span>
          </div>

          {ordersQuery.isPending ? (
            <div className="space-y-3 p-4 sm:p-5" aria-busy="true" aria-label="Loading orders">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-2.5 w-28" />
                  </div>
                  <Skeleton className="h-4 w-14" />
                </div>
              ))}
            </div>
          ) : ordersQuery.isError ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">Could not load your orders. Check your connection and try again.</p>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
              <Package className="h-7 w-7 text-muted-foreground/40" />
              <p className="text-sm font-medium">No orders yet</p>
              <p className="text-xs text-muted-foreground">Everything you order will show up here, with its status and bill.</p>
            </div>
          ) : (
            <>
              <div className="divide-y">
                {visibleOrders.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </div>
              {orders.length > COLLAPSED_COUNT && (
                <div className="border-t px-4 py-2.5 text-center">
                  <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setShowAll((current) => !current)}>
                    {showAll ? 'Show fewer' : `Show all ${orders.length} orders`}
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Who the account belongs to, plus the rest of their activity. */}
        <div className="space-y-4">
          <Card className="!p-0 overflow-hidden">
            <div className="flex items-center gap-3 border-b bg-muted/40 px-4 py-3.5 sm:px-5">
              {profile?.profileImageUrl ? (
                <Image src={profile.profileImageUrl} alt={name} width={40} height={40} className="h-10 w-10 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{initials(name)}</span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold capitalize">{name}</p>
                <p className="text-xs text-muted-foreground">Customer account</p>
              </div>
            </div>
            <div className="space-y-2.5 p-4 sm:p-5">
              {profileQuery.isPending ? (
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3.5 w-2/3" />
                </div>
              ) : (
                <>
                  <DetailRow icon={Mail} label="Email" value={profile?.email} />
                  <DetailRow icon={Phone} label="Phone" value={profile?.phone} />
                  <DetailRow icon={MapPin} label="City" value={[profile?.city, profile?.state].filter(Boolean).join(', ')} />
                  <DetailRow icon={CalendarDays} label="Member since" value={profile?.createdAt ? format(new Date(profile.createdAt), 'dd MMM yyyy') : undefined} />
                </>
              )}
            </div>
          </Card>

          <Card className="!p-0 overflow-hidden">
            <Link href="/dashboard/reviews" className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 sm:px-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Star className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">My reviews</p>
                <p className="text-xs text-muted-foreground">{reviewCount === 0 ? 'Rate something you bought' : `${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'} written`}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Card>

          {cartQuantity > 0 && (
            <Card className="!p-4 space-y-2 border-primary/30 bg-primary/5">
              <p className="text-sm font-semibold">
                {cartQuantity} {cartQuantity === 1 ? 'item' : 'items'} waiting in your cart
              </p>
              <Button asChild size="sm" className="w-full gap-1.5">
                <Link href="/dashboard/cart">
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Go to checkout
                </Link>
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
