'use client';

import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useClearCart, useGetActiveCart, useRemoveFromCart, useUpdateCartQuantity } from '@/hooks/service-hooks/useCartService';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { Minus, Package, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function CartPage() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const pathname = usePathname();

  // Mounted under both /admin and /dashboard, which middleware.ts gates by role,
  // so keep links inside the current area.
  const posHref = pathname?.startsWith('/dashboard') ? '/dashboard/purchase/' : '/admin/purchase/';

  const { data: cartResponse, isLoading, isError } = useGetActiveCart();
  const cart = cartResponse?.data?.data ?? null;
  const items = cart?.items ?? [];

  const updateQuantityMutation = useUpdateCartQuantity();
  const removeMutation = useRemoveFromCart();
  const clearMutation = useClearCart();

  const isMutating = updateQuantityMutation.isPending || removeMutation.isPending || clearMutation.isPending;

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

  const setQuantity = (productId: number, quantity: number) =>
    runCartAction(() => updateQuantityMutation.mutateAsync({ productId, model: { quantity } }), 'Could not update quantity');

  const removeItem = (productId: number) => runCartAction(() => removeMutation.mutateAsync({ productId }), 'Could not remove item');

  const clearCart = () => runCartAction(() => clearMutation.mutateAsync(undefined), 'Could not clear cart');

  const currency = cart?.currency ?? 'INR';
  const money = (value: number | null) => `${currency} ${(value ?? 0).toFixed(2)}`;

  if (isError) {
    return <div className="py-10 text-center text-destructive">Failed to load your cart. Please try again.</div>;
  }

  return (
    <div className="grid gap-5">
      <PageHeader title="Cart" description="Products held in your active cart" actionText="Browse products" href={posHref} />

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
          <div className="rounded-full bg-muted p-4 text-muted-foreground">
            <ShoppingCart className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Your cart is empty</p>
            <p className="text-xs text-muted-foreground">Add products from the catalog to get started.</p>
          </div>
          <Button asChild size="sm" className="mt-2">
            <Link href={posHref}>Browse products</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* Lines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {items.length} {items.length === 1 ? 'product' : 'products'} · {cart?.totalQuantity ?? 0} total qty
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                onClick={clearCart}
                disabled={isMutating}
                type="button"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear cart
              </Button>
            </div>

            {items.map((item) => (
              <Card key={item.id} className="flex items-center gap-4 p-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
                  {item.productImages?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.productImages[0]} alt={item.productName} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-6 w-6 text-muted-foreground/40" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.unitPrice === null ? 'No price recorded' : `${money(item.unitPrice)} each`}
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-md hover:bg-background"
                        onClick={() => setQuantity(item.productId, item.quantity - 1)}
                        disabled={isMutating}
                        aria-label={`Decrease quantity of ${item.productName}`}
                        type="button"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-7 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-md hover:bg-background"
                        onClick={() => setQuantity(item.productId, item.quantity + 1)}
                        disabled={isMutating}
                        aria-label={`Increase quantity of ${item.productName}`}
                        type="button"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeItem(item.productId)}
                      disabled={isMutating}
                      aria-label={`Remove ${item.productName} from cart`}
                      type="button"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Line total</p>
                  <p className="text-base font-bold text-foreground">{money(item.lineTotal)}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Summary */}
          <Card className="h-fit p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Summary</h3>
              {cart?.status && <Badge variant="green">{cart.status}</Badge>}
            </div>

            <Separator className="mb-3" />

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Products</dt>
                <dd className="font-medium">{items.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total quantity</dt>
                <dd className="font-medium">{cart?.totalQuantity ?? 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Currency</dt>
                <dd className="font-medium">{currency}</dd>
              </div>
            </dl>

            <Separator className="my-3" />

            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-xl font-bold text-primary">{money(cart?.totalAmount ?? 0)}</span>
            </div>

            {/* Checkout needs a customer and the discount/tax fields, which live on the
                POS screen - so send the user there rather than duplicating that form. */}
            <Button asChild className="mt-4 w-full">
              <Link href={posHref}>Continue to checkout</Link>
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
