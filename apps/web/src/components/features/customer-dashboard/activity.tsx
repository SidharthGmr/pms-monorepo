'use client';

import StatusBadge from '@/components/common/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useGetActiveCart } from '@/hooks/service-hooks/useCartService';
import { useGetOrderReturnsByCustomerId } from '@/hooks/service-hooks/useOrderReturnService';
import { useGetOrdersByCustomerId } from '@/hooks/service-hooks/useOrderService';
import { useGetAllReviews } from '@/hooks/service-hooks/useReviewService';
import { useGetUserById } from '@/hooks/service-hooks/useUserList.service.hook';
import { useGetAllWishlists } from '@/hooks/service-hooks/useWishlistService';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { OrderDto, OrderReturnDto, OrderStatusEnum, ReturnStatusEnum, ReturnTypeEnum, UserDto } from '@pms/types';
import { format } from 'date-fns';
import { CalendarDays, ChevronRight, Heart, History, LucideIcon, Mail, Package, Pencil, Phone, Repeat, ShoppingBag, ShoppingCart, Star, Undo2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ReactNode, useMemo, useState } from 'react';
import { RETURN_TYPE_LABEL, returnToneFor } from '../order-returns/return-status';
import { toneFor } from '../orders/order-status';

const COLLAPSED_EVENTS = 8;

// Cancelled and returned orders are not money spent, so they stay out of the total.
const UNSPENT = new Set<string>([OrderStatusEnum.Cancelled, OrderStatusEnum.Returned]);

const initials = (name?: string | null) =>
  (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('') || '?';

// Orders and returns folded into one feed, newest first; the month label groups them.
type ActivityEvent = { key: string; at: Date; month: string } & ({ kind: 'order'; order: OrderDto } | { kind: 'return'; orderReturn: OrderReturnDto });

function StatCell({ label, value, hint, href, loading }: { label: string; value: ReactNode; hint?: string; href?: string; loading?: boolean }) {
  const body = (
    <div className={cn('min-w-0 px-4 py-3 sm:px-5', href && 'transition-colors hover:bg-muted/50')}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      {loading ? <Skeleton className="mt-1.5 h-6 w-16" /> : <p className="mt-0.5 truncate text-xl font-bold tabular-nums">{value}</p>}
      {hint && <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
  return href ? (
    <Link href={href} className="block min-w-0 outline-none focus-visible:bg-muted/50">
      {body}
    </Link>
  ) : (
    body
  );
}

function EventRow({ event }: { event: ActivityEvent }) {
  if (event.kind === 'order') {
    const { order } = event;
    const tone = toneFor(order.status);
    const quantity = (order.items ?? []).reduce((sum, item) => sum + (item.quantity ?? 0), 0);
    return (
      <Link href={`/dashboard/orders/${order.id}`} className="group relative flex items-start gap-3 py-2.5 outline-none">
        <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card">
          <span className={cn('flex h-full w-full items-center justify-center rounded-full border', tone.soft, tone.text)}>
            <Package className="h-4 w-4" />
          </span>
        </span>
        <div className="min-w-0 flex-1 rounded-lg border border-transparent px-2 py-1 transition-colors group-hover:border-border group-hover:bg-muted/40">
          <div className="flex items-center gap-2">
            <p className="truncate text-xs font-semibold sm:text-sm">Placed an order</p>
            <StatusBadge status={order.status} tone={tone} size="xs" />
          </div>
          <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
            {order.orderNumber} · {format(event.at, 'dd MMM yyyy')} · {quantity} {quantity === 1 ? 'item' : 'items'}
          </p>
        </div>
        <span className="shrink-0 pt-1 text-sm font-semibold tabular-nums">{formatPrice(order.grandTotal ?? 0)}</span>
        <ChevronRight className="mt-1.5 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
      </Link>
    );
  }

  const { orderReturn } = event;
  const tone = returnToneFor(orderReturn.status);
  const isExchange = String(orderReturn.type) === ReturnTypeEnum.Exchange;
  const TypeIcon = isExchange ? Repeat : Undo2;
  return (
    <Link href={`/dashboard/orders/${orderReturn.orderId}`} className="group relative flex items-start gap-3 py-2.5 outline-none">
      <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card">
        <span className={cn('flex h-full w-full items-center justify-center rounded-full border', tone.soft, tone.text)}>
          <TypeIcon className="h-4 w-4" />
        </span>
      </span>
      <div className="min-w-0 flex-1 rounded-lg border border-transparent px-2 py-1 transition-colors group-hover:border-border group-hover:bg-muted/40">
        <div className="flex items-center gap-2">
          <p className="truncate text-xs font-semibold sm:text-sm">Raised {isExchange ? 'an exchange' : 'a refund'}</p>
          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium', tone.soft, tone.text)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
            {tone.label}
          </span>
        </div>
        <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
          {orderReturn.returnNumber} · on {orderReturn.order?.orderNumber ?? `order #${orderReturn.orderId}`} · {format(event.at, 'dd MMM yyyy')}
        </p>
      </div>
      <span className="shrink-0 pt-1 text-sm font-semibold tabular-nums">
        {isExchange && !orderReturn.refundAmount ? RETURN_TYPE_LABEL[String(orderReturn.type)] : formatPrice(orderReturn.refundAmount ?? 0)}
      </span>
      <ChevronRight className="mt-1.5 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function QuickLink({ icon: Icon, label, hint, href, chip }: { icon: LucideIcon; label: string; hint: string; href: string; chip: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 sm:px-5">
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', chip)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{hint}</p>
      </div>
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
 * The Timeline reading of the customer's account: orders and returns folded into one
 * chronological feed grouped by month, with the stat strip above it and the profile and
 * quick links in the rail. Same queries as Overview, different shape.
 */
export default function CustomerActivityDashboard() {
  const { currentUser } = useGetCurrentUser();
  const userId = currentUser?.usersId;

  const ordersQuery = useGetOrdersByCustomerId(userId ?? '', undefined, !!userId);
  const returnsQuery = useGetOrderReturnsByCustomerId(userId ?? '', !!userId);
  const profileQuery = useGetUserById(userId ?? '', !!userId);
  const wishlistQuery = useGetAllWishlists({ userId, page: 1, recordPerPage: 1 }, !!userId);
  const reviewsQuery = useGetAllReviews({ userId, page: 1, recordPerPage: 1 }, !!userId);
  const cartQuery = useGetActiveCart(!!userId);

  const [showAll, setShowAll] = useState(false);

  const orders = useMemo<OrderDto[]>(() => ordersQuery.data?.data?.data?.data ?? [], [ordersQuery.data]);
  const orderReturns = useMemo<OrderReturnDto[]>(() => returnsQuery.data?.data?.data?.data ?? [], [returnsQuery.data]);
  const totalSpent = useMemo(() => orders.filter((order) => !UNSPENT.has(String(order.status))).reduce((sum, order) => sum + (order.grandTotal ?? 0), 0), [orders]);
  // Only a COMPLETED return has actually handed money back; everything else is still in flight.
  const refundedBack = useMemo(
    () => orderReturns.filter((item) => String(item.status) === ReturnStatusEnum.Completed).reduce((sum, item) => sum + (item.refundAmount ?? 0), 0),
    [orderReturns]
  );

  const events = useMemo<ActivityEvent[]>(() => {
    const merged: ActivityEvent[] = [
      ...orders.map((order): ActivityEvent => {
        const at = new Date(order.createdAt);
        return { key: `order-${order.id}`, kind: 'order', order, at, month: format(at, 'MMMM yyyy') };
      }),
      ...orderReturns.map((orderReturn): ActivityEvent => {
        const at = new Date(orderReturn.createdAt);
        return { key: `return-${orderReturn.id}`, kind: 'return', orderReturn, at, month: format(at, 'MMMM yyyy') };
      }),
    ];
    return merged.sort((a, b) => b.at.getTime() - a.at.getTime());
  }, [orders, orderReturns]);

  const profile = profileQuery.data?.data?.data as UserDto | undefined;
  const wishlistCount = wishlistQuery.data?.data?.data?.totalRecord ?? 0;
  const reviewCount = reviewsQuery.data?.data?.data?.totalRecord ?? 0;
  const cartItems = cartQuery.data?.data?.data?.items ?? [];
  const cartQuantity = cartItems.reduce((sum, item) => sum + (item.quantity ?? 0), 0);

  const name = profile?.name || currentUser?.name || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const visibleEvents = showAll ? events : events.slice(0, COLLAPSED_EVENTS);
  const feedLoading = ordersQuery.isPending || returnsQuery.isPending;

  // Month headings appear where the month changes, so the feed reads as a diary.
  let lastMonth = '';

  return (
    <div className="space-y-5">
      {/* Compact header - Timeline trades the banner for more room in the feed. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {profile?.profileImageUrl ? (
            <Image src={profile.profileImageUrl} alt={name} width={44} height={44} className="h-11 w-11 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{initials(name)}</span>
          )}
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">
              {greeting}, <span className="capitalize">{name}</span>!
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Everything you ordered and returned, in the order it happened.</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/dashboard/shop">
              <ShoppingBag className="h-3.5 w-3.5" />
              Shop now
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link href="/dashboard/edit-profile">
              <Pencil className="h-3.5 w-3.5" />
              Edit profile
            </Link>
          </Button>
        </div>
      </div>

      {/* One strip, four numbers. */}
      <Card className="!p-0 grid grid-cols-2 divide-y overflow-hidden sm:grid-cols-4 sm:divide-y-0 [&>*:nth-child(even)]:border-l sm:[&>*+*]:border-l">
        <StatCell label="My orders" value={orders.length} hint={orders[0] ? `Last on ${format(new Date(orders[0].createdAt), 'dd MMM')}` : 'No orders yet'} loading={ordersQuery.isPending} />
        <StatCell
          label="Total spent"
          value={formatPrice(Math.max(0, totalSpent - refundedBack))}
          hint={refundedBack > 0 ? `After ${formatPrice(refundedBack)} refunded` : 'Across all open orders'}
          loading={ordersQuery.isPending || returnsQuery.isPending}
        />
        <StatCell label="In cart" value={cartQuantity} hint={cartQuantity > 0 ? 'Ready to check out' : 'Your cart is empty'} href="/dashboard/cart" loading={cartQuery.isPending} />
        <StatCell label="Wishlist" value={wishlistCount} hint={wishlistCount > 0 ? 'Saved for later' : 'Nothing saved yet'} href="/dashboard/wishlist" loading={wishlistQuery.isPending} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* The feed - orders and returns on one line of time. */}
        <Card className="!p-0 overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5">
            <div>
              <h2 className="text-sm font-semibold">Activity</h2>
              <p className="text-xs text-muted-foreground">Orders and returns, newest first</p>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">{events.length}</span>
          </div>

          {feedLoading ? (
            <div className="space-y-3 p-4 sm:p-5" aria-busy="true" aria-label="Loading activity">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-44 max-w-full" />
                    <Skeleton className="h-2.5 w-32 max-w-full" />
                  </div>
                  <Skeleton className="h-4 w-14" />
                </div>
              ))}
            </div>
          ) : ordersQuery.isError || returnsQuery.isError ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">Could not load your activity. Check your connection and try again.</p>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
              <History className="h-7 w-7 text-muted-foreground/40" />
              <p className="text-sm font-medium">Nothing here yet</p>
              <p className="text-xs text-muted-foreground">Your orders and any refunds or exchanges will build a history here.</p>
            </div>
          ) : (
            <>
              <div className="relative px-4 py-3 sm:px-5">
                {/* The spine the event dots sit on. */}
                <span className="absolute bottom-5 top-5 ml-[17px] w-px bg-border" aria-hidden />
                {visibleEvents.map((event) => {
                  const showMonth = event.month !== lastMonth;
                  lastMonth = event.month;
                  return (
                    <div key={event.key}>
                      {showMonth && (
                        <p className="relative z-10 -ml-1 w-fit bg-card py-1.5 pl-1 pr-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{event.month}</p>
                      )}
                      <EventRow event={event} />
                    </div>
                  );
                })}
              </div>
              {events.length > COLLAPSED_EVENTS && (
                <div className="border-t px-4 py-2.5 text-center">
                  <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setShowAll((current) => !current)}>
                    {showAll ? 'Show fewer' : `Show all ${events.length} events`}
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Who the account belongs to, and the places they go. */}
        <div className="space-y-4">
          <Card className="!p-0 overflow-hidden">
            <div className="border-b bg-muted/40 px-4 py-3.5 sm:px-5">
              <p className="truncate text-sm font-semibold capitalize">{name}</p>
              <p className="text-xs text-muted-foreground">Customer account</p>
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
                  <DetailRow icon={CalendarDays} label="Member since" value={profile?.createdAt ? format(new Date(profile.createdAt), 'dd MMM yyyy') : undefined} />
                </>
              )}
            </div>
          </Card>

          <Card className="!p-0 divide-y overflow-hidden">
            <QuickLink icon={ShoppingBag} label="Shop" hint="Browse the catalog" href="/dashboard/shop" chip="bg-primary/10 text-primary" />
            <QuickLink
              icon={ShoppingCart}
              label="Cart"
              hint={cartQuantity > 0 ? `${cartQuantity} ${cartQuantity === 1 ? 'item' : 'items'} waiting` : 'Your cart is empty'}
              href="/dashboard/cart"
              chip="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            />
            <QuickLink
              icon={Heart}
              label="Wishlist"
              hint={wishlistCount > 0 ? `${wishlistCount} saved for later` : 'Nothing saved yet'}
              href="/dashboard/wishlist"
              chip="bg-rose-500/10 text-rose-600 dark:text-rose-400"
            />
            <QuickLink
              icon={Star}
              label="My reviews"
              hint={reviewCount === 0 ? 'Rate something you bought' : `${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'} written`}
              href="/dashboard/reviews"
              chip="bg-sky-500/10 text-sky-600 dark:text-sky-400"
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
