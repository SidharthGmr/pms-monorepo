'use client';
import { KeyboardEvent, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, ArrowRight, Lock, Minus, Package, Plus, ShoppingBag, ShoppingCart, Trash2 } from 'lucide-react';
import { CartItemDto } from '@pms/types';
import ConfirmBox from '@/components/common/confirm-box';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useClearCart, useGetActiveCart, useRemoveCartVariant, useUpdateCartVariantQuantity } from '@/hooks/service-hooks/useCartService';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';

const QUANTITY_MAX = 999;

// `p-0` alone loses to the Card's own `md:p-5` in tailwind-merge (different variant).
const FLUSH_CARD = 'p-0 md:p-0';

export default function CartPage() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const pathname = usePathname();

  // Mounted under both /admin and /dashboard, which middleware.ts gates by role, so keep links inside the current area.
  const area = pathname?.startsWith('/dashboard') ? '/dashboard' : '/admin';
  const browseHref = `${area}/purchase/`;
  const checkoutHref = `${area}/checkout`;

  const { data: cartResponse, isLoading, isError, isFetching } = useGetActiveCart();
  const cart = cartResponse?.data?.data ?? null;
  const items = cart?.items ?? [];

  // Each line is one variant, so edit by variantId. The product-keyed hooks cannot tell two variants of the same product apart.
  const updateQuantityMutation = useUpdateCartVariantQuantity();
  const removeMutation = useRemoveCartVariant();
  const clearMutation = useClearCart();
  const [confirmClear, setConfirmClear] = useState(false);

  const isMutating = updateQuantityMutation.isPending || removeMutation.isPending || clearMutation.isPending;
  // The line being changed right now, so only that row dims instead of the whole list.
  const busyVariantId = updateQuantityMutation.isPending ? updateQuantityMutation.variables?.variantId : removeMutation.isPending ? removeMutation.variables : undefined;

  const runCartAction = async (action: () => Promise<any>, failureTitle: string) => {
    try {
      const response = await action();
      if (!response || response.status !== 200) {
        const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
        toast({ variant: 'destructive', title: failureTitle, description: <span>{error}</span> });
      }
    } catch (error) {
      const message = unitOfService.ErrorHandlerService.getErrorMessage(error as never);
      toast({ variant: 'destructive', title: failureTitle, description: <span>{message}</span> });
    }
  };

  const setQuantity = (variantId: number, quantity: number) => {
    const next = Math.min(QUANTITY_MAX, Math.max(0, Math.round(quantity)));
    return runCartAction(() => updateQuantityMutation.mutateAsync({ variantId, model: { quantity: next } }), 'Could not update quantity');
  };

  const removeItem = (item: CartItemDto) =>
    runCartAction(async () => {
      const response = await removeMutation.mutateAsync(item.variantId);
      if (response?.status === 200) toast({ variant: 'success', title: `Removed ${item.productName}` });
      return response;
    }, 'Could not remove item');

  const clearCart = () => {
    setConfirmClear(false);
    return runCartAction(() => clearMutation.mutateAsync(), 'Could not clear cart');
  };

  const currency = cart?.currency ?? 'INR';
  const money = (value: number | null | undefined) =>
    `${currency === 'INR' ? '₹' : `${currency} `}${(value ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const unpriced = items.filter((item) => item.unitPrice === null).length;
  const updatedAt = cart?.updatedAt ?? cart?.createdAt;

  if (isError) {
    return (
      <Card className="mx-auto max-w-6xl py-16 text-center">
        <p className="text-sm font-semibold text-destructive">Could not load your cart</p>
        <p className="mt-1 text-xs text-muted-foreground">Check your connection and refresh the page.</p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShoppingCart className="h-5 w-5" />
            </span>
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
                Cart
                {!isLoading && items.length > 0 && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold tabular-nums text-primary-foreground">{cart?.totalQuantity ?? 0}</span>
                )}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isLoading
                  ? 'Loading your cart…'
                  : items.length === 0
                    ? 'Nothing in your cart yet.'
                    : `${items.length} ${items.length === 1 ? 'product' : 'products'}${updatedAt ? ` · updated ${formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}` : ''}`}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="gap-2">
            <Link href={browseHref}>
              <ArrowLeft className="h-4 w-4" />
              Continue shopping
            </Link>
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <Card className={cn(FLUSH_CARD, 'divide-y overflow-hidden')}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="h-20 w-20 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                  <Skeleton className="h-8 w-32" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </Card>
          <Skeleton className="h-72 w-full rounded-lg" />
        </div>
      ) : items.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" aria-hidden />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 text-primary">
              <ShoppingBag className="h-9 w-9" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold">Your cart is empty</p>
            <p className="max-w-sm text-sm text-muted-foreground">Browse the catalog and add products; they will wait for you here until checkout.</p>
          </div>
          <Button asChild className="mt-1 gap-2">
            <Link href={browseHref}>
              Browse products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
          <Card className={cn(FLUSH_CARD, 'overflow-hidden', isFetching && !isMutating && 'opacity-80 transition-opacity')}>
            <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Items</p>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmClear(true)}
                disabled={isMutating}
                type="button"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear cart
              </Button>
            </div>

            <ul className="divide-y">
              {items.map((item) => (
                <CartLine
                  key={item.id}
                  item={item}
                  money={money}
                  busy={busyVariantId === item.variantId}
                  disabled={isMutating}
                  productHref={`${area}/products/${item.productId}`}
                  onQuantity={(q) => setQuantity(item.variantId, q)}
                  onRemove={() => removeItem(item)}
                />
              ))}
            </ul>
          </Card>

          <Card className="lg:sticky lg:top-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold">Order summary</h2>
              {cart?.status && (
                <Badge variant="green" className="px-1.5 py-0 text-[10px] capitalize">
                  {String(cart.status).toLowerCase()}
                </Badge>
              )}
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Products</dt>
                <dd className="font-medium tabular-nums">{items.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total quantity</dt>
                <dd className="font-medium tabular-nums">{cart?.totalQuantity ?? 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium tabular-nums">{money(cart?.totalAmount)}</dd>
              </div>
            </dl>

            <Separator className="my-3" />

            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold">Estimated total</span>
              <span className="text-2xl font-bold tabular-nums text-primary">{money(cart?.totalAmount)}</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Taxes and delivery are worked out at checkout.</p>

            {unpriced > 0 && (
              <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                {unpriced} {unpriced === 1 ? 'item has' : 'items have'} no price recorded and {unpriced === 1 ? 'is' : 'are'} not included in the total.
              </p>
            )}

            <Button asChild size="lg" className="mt-4 w-full gap-2" disabled={isMutating}>
              <Link href={checkoutHref}>
                Continue to checkout
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <Lock className="h-3 w-3" />
              Secure checkout · {currency}
            </p>
          </Card>
        </div>
      )}

      <ConfirmBox
        isOpen={confirmClear}
        onClose={() => setConfirmClear(false)}
        onSubmit={clearCart}
        heading="Clear the cart?"
        bodyText={`This removes all ${items.length} ${items.length === 1 ? 'product' : 'products'} from your cart. You can add them again from the catalog.`}
        noButtonText="Keep items"
        yesButtonText="Clear cart"
        loading={clearMutation.isPending}
      />
    </div>
  );
}

interface CartLineProps {
  item: CartItemDto;
  money: (value: number | null | undefined) => string;
  busy: boolean;
  disabled: boolean;
  productHref: string;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
}

// One cart row. The quantity box is editable directly and commits on blur or Enter; the +/- buttons commit at once.
function CartLine({ item, money, busy, disabled, productHref, onQuantity, onRemove }: CartLineProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const shownQuantity = draft ?? String(item.quantity);
  const showVariant = !!item.variantName && item.variantName !== item.productName;

  const commit = () => {
    if (draft === null) return;
    const next = Number(draft);
    setDraft(null);
    if (!Number.isFinite(next) || next === item.quantity) return;
    onQuantity(next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
    if (e.key === 'Escape') setDraft(null);
  };

  return (
    <li className={cn('flex gap-4 p-4 transition-opacity', busy && 'opacity-50')} aria-busy={busy}>
      <Link href={productHref} className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
        {item.productImages?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.productImages[0]} alt="" className="h-full w-full object-cover" />
        ) : (
          <Package className="h-7 w-7 text-muted-foreground/40" />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0 flex-1">
          <Link href={productHref} className="line-clamp-2 text-sm font-semibold leading-tight hover:underline" title={item.productName}>
            {item.productName}
          </Link>
          {showVariant && <span className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">{item.variantName}</span>}
          <p className="mt-1 text-xs text-muted-foreground">{item.unitPrice === null ? 'No price recorded' : `${money(item.unitPrice)} each`}</p>
        </div>

        <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1.5">
          <div className="flex items-center rounded-lg border bg-background">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => onQuantity(item.quantity - 1)}
              disabled={disabled}
              aria-label={`Decrease quantity of ${item.productName}`}
              type="button"
            >
              {item.quantity <= 1 ? <Trash2 className="h-3.5 w-3.5 text-destructive" /> : <Minus className="h-3.5 w-3.5" />}
            </Button>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={QUANTITY_MAX}
              value={shownQuantity}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={onKeyDown}
              disabled={disabled}
              aria-label={`Quantity of ${item.productName}`}
              className="h-8 w-12 border-x bg-transparent text-center text-sm font-semibold tabular-nums focus:outline-none focus-visible:bg-muted/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => onQuantity(item.quantity + 1)}
              disabled={disabled || item.quantity >= QUANTITY_MAX}
              aria-label={`Increase quantity of ${item.productName}`}
              type="button"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="text-[11px] text-muted-foreground underline-offset-2 hover:text-destructive hover:underline disabled:opacity-50"
          >
            Remove
          </button>
        </div>

        <div className="shrink-0 text-right sm:w-28">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Line total</p>
          <p className="text-base font-bold tabular-nums">{item.lineTotal === null ? '—' : money(item.lineTotal)}</p>
        </div>
      </div>
    </li>
  );
}
