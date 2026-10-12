'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { useGetAllPublicCategories } from '@/hooks/service-hooks/useCategoryService';
import { useGetAllPublicProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { cn } from '@/lib/utils';
import { ProductVariantListItemDto } from '@pms/types';
import { LayoutGrid, PackageSearch, ScanBarcode, Search, ShoppingCart } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import CartPanel from './cart-panel';
import PaymentScreen from './payment-screen';
import { usePosCart } from './use-pos-cart';
import VariantTile from './variant-tile';
import { formatPrice } from '@/lib/format-price';

const PAGE_SIZE = 60;

export default function PosTerminal() {
  const { currentUser } = useGetCurrentUser();
  const storeCode = currentUser?.storeCode || undefined;

  const [screen, setScreen] = useState<'till' | 'payment'>('till');
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Autofocus is a desktop convenience; on a phone it would pop the keyboard over the grid.
  useEffect(() => {
    try {
      if (window.matchMedia('(min-width: 1024px)').matches) searchRef.current?.focus();
    } catch {
      return;
    }
  }, []);

  // Typing filters once the keys pause; a barcode scanner "types" fast and ends the same way.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchText.trim()), 250);
    return () => clearTimeout(timer);
  }, [searchText]);

  const cart = usePosCart();

  const variantsQuery = useGetAllPublicProductVariants(
    { storeCode, search: search || undefined, categoryId: categoryId ?? undefined, recordPerPage: PAGE_SIZE },
    !!storeCode
  );
  const categoriesQuery = useGetAllPublicCategories({ showAllRecords: true, storeCode });

  const variants = useMemo(() => (variantsQuery.data?.data?.data?.data as ProductVariantListItemDto[] | undefined) ?? [], [variantsQuery.data]);
  const categories = useMemo(() => {
    const all = categoriesQuery.data?.data?.data?.data ?? [];
    return all.filter((category) => category.parentId == null);
  }, [categoriesQuery.data]);

  if (screen === 'payment') {
    return (
      <PaymentScreen
        lines={cart.lines}
        onBack={() => setScreen('till')}
        onComplete={() => cart.clear()}
      />
    );
  }

  return (
    <div className="grid min-h-0 gap-4 pb-20 lg:h-[calc(100vh-7.5rem)] lg:grid-cols-[minmax(0,1fr)_380px] lg:pb-0">
      {/* Left: the catalogue - variants on top, category rail below. */}
      <div className="flex min-h-0 flex-col gap-3">
        <div className="flex shrink-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ScanBarcode className="h-5 w-5" />
          </span>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search name, SKU or scan a barcode…"
              aria-label="Search products"
              ref={searchRef}
              className="h-10 pl-9"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border bg-muted/20 p-3 [scrollbar-width:thin]">
          {variantsQuery.isPending ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {Array.from({ length: 10 }, (_, index) => (
                <Skeleton key={index} className="aspect-[3/4] rounded-xl" />
              ))}
            </div>
          ) : variantsQuery.isError ? (
            <p className="py-16 text-center text-sm text-destructive">Could not load the catalogue. Check the connection and refresh.</p>
          ) : variants.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
              <PackageSearch className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">Nothing matches</p>
              <p className="text-xs">Try another search{categoryId !== null ? ' or switch category' : ''}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {variants.map((variant) => (
                <VariantTile key={variant.id} variant={variant} inCart={cart.quantityOf(variant.id)} onAdd={cart.addVariant} />
              ))}
            </div>
          )}
        </div>

        {/* Category rail: one tap narrows the grid above. */}
        <div className="flex shrink-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          <CategoryChip icon label="All" active={categoryId === null} onClick={() => setCategoryId(null)} />
          {categories.map((category) => (
            <CategoryChip key={category.id} label={category.name} active={categoryId === category.id} onClick={() => setCategoryId(category.id)} />
          ))}
        </div>
      </div>

      {/* Right: the running order. On phones the cart lives in a pull-up sheet instead, so the
          catalogue keeps the whole screen and the order is always one tap away. */}
      <div className="hidden lg:block lg:min-h-0">
        <CartPanel
          lines={cart.lines}
          held={cart.held}
          totals={cart.totals}
          setQuantity={cart.setQuantity}
          removeLine={cart.removeLine}
          onCancel={cart.clear}
          onHold={cart.hold}
          onResume={cart.resume}
          onDiscardHeld={cart.discardHeld}
          onCheckout={() => setScreen('payment')}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">
              {cart.totals.units > 0 ? `${cart.totals.units} ${cart.totals.units === 1 ? 'item' : 'items'}` : 'No items yet'}
              {cart.held.length > 0 && ` · ${cart.held.length} held`}
            </p>
            <p className="text-lg font-bold tabular-nums leading-tight">{formatPrice(cart.totals.subtotal)}</p>
          </div>
          <Button type="button" className="h-11 shrink-0 gap-2 px-5 font-bold" onClick={() => setCartOpen(true)}>
            <ShoppingCart className="h-4 w-4" />
            View order
          </Button>
        </div>
      </div>

      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="bottom" className="h-[88vh] rounded-t-2xl p-2 pt-8">
          <SheetTitle className="sr-only">Current order</SheetTitle>
          <div className="h-full">
            <CartPanel
              lines={cart.lines}
              held={cart.held}
              totals={cart.totals}
              setQuantity={cart.setQuantity}
              removeLine={cart.removeLine}
              onCancel={cart.clear}
              onHold={cart.hold}
              onResume={cart.resume}
              onDiscardHeld={cart.discardHeld}
              onCheckout={() => {
                setCartOpen(false);
                setScreen('payment');
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CategoryChip({ label, active, onClick, icon = false }: { label: string; active: boolean; onClick: () => void; icon?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
        active ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
      )}
    >
      {icon && <LayoutGrid className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}
