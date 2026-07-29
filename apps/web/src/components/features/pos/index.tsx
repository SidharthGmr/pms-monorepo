'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { SelectSearch } from '@/components/common/select-search';
import { ProductDto } from '@/dtos/product.dto';
import { OrderStatus } from '@/enums/order-status.enum';
import { Roles } from '@/enums/roles.enum';
import { useAddToCart, useClearCart, useGetActiveCart, useRemoveFromCart, useUpdateCartQuantity } from '@/hooks/service-hooks/useCartService';
import { useCreateOrder } from '@/hooks/service-hooks/useOrderService';
import { useGetAllProducts } from '@/hooks/service-hooks/useProductService';
import { useGetAllUserList } from '@/hooks/service-hooks/useUserList.service.hook';
import { useGetAllWishlists } from '@/hooks/service-hooks/useWishlistService';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import WishlistToggle from '@/components/common/wishlist-toggle';
import ProductRating from './product-rating';
import ProductVariantsStrip from './product-variants-strip';
import { FileText, Landmark, Minus, Package, Percent, Plus, ShoppingBag, ShoppingCart, Trash2, User, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/common/page-header';

import config from '@/config';
import { cn } from '@/lib/utils';
import { ProductFilterParams } from '@/params/product.params';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import { useTanstackTablePagination } from '@/hooks/use-tanstack-table-pagination';
import { useTanstackTableSorting } from '@/hooks/use-tanstack-table-sorting';
import { DataTablePagination } from '@/components/Table/data-table-pagination';
import ProductListFilter from '@/components/features/products/filter';

const CheckoutSchema = yup.object().shape({
  discount: yup.number().min(0, 'Must be >= 0').typeError('Must be a number').optional().default(0),
  tax: yup.number().min(0, 'Must be >= 0').typeError('Must be a number').optional().default(0),
  shippingCost: yup.number().min(0, 'Must be >= 0').typeError('Must be a number').optional().default(0),
  notes: yup.string().optional(),
});

type CheckoutFormValues = yup.InferType<typeof CheckoutSchema>;

/**
 * One line of the persisted cart, shaped for this screen. The server cart is the
 * source of truth; `stock` is filled in from the loaded catalog because the cart
 * API returns product identity and price but not stock levels.
 */
interface CartLine {
  /** productId - the cart API addresses items by product, not variant. */
  id: number;
  name: string;
  price: number;
  cartQuantity: number;
  stock: number;
  images: string[];
}

/** Small quantity stepper reused in the catalog card and the cart list. */
function QuantityStepper({
  quantity,
  onDecrease,
  onIncrease,
  canIncrease,
  size = 'sm',
}: {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  canIncrease: boolean;
  size?: 'sm' | 'md';
}) {
  const btn = size === 'md' ? 'h-8 w-8' : 'h-7 w-7';
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-0.5">
      <Button variant="ghost" size="icon" className={`${btn} rounded-md hover:bg-background`} onClick={onDecrease} type="button">
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <span className="w-6 text-center text-sm font-semibold tabular-nums text-foreground">{quantity}</span>
      <Button
        variant="ghost"
        size="icon"
        className={`${btn} rounded-md hover:bg-background`}
        onClick={onIncrease}
        disabled={!canIncrease}
        type="button"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

/**
 * Product image with an e-commerce-style gallery: the selected image shows large,
 * and when a product has more than one image a thumbnail strip renders below it.
 * Clicking a thumbnail swaps the main image.
 */
function ProductCardImage({
  images,
  name,
  soldOut,
  badge,
  action,
}: {
  images?: string[];
  name: string;
  soldOut: boolean;
  badge: React.ReactNode;
  /** Rendered over the top-right corner, opposite the stock badge. */
  action?: React.ReactNode;
}) {
  const gallery = (images || []).filter(Boolean);
  const [active, setActive] = useState(0);
  const activeSrc = gallery[active] ?? gallery[0];

  return (
    <div>
      {/* Main image */}
      <div className="relative flex h-40 items-center justify-center overflow-hidden border-b border-border bg-muted/40">
        {activeSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={activeSrc} alt={name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <Package className="h-10 w-10 text-muted-foreground/40 transition-transform duration-500 group-hover:scale-110" />
        )}
        <div className="absolute left-3 top-3">{badge}</div>
        {/* Above the sold-out scrim so the heart stays usable on an unavailable product. */}
        {action && <div className="absolute right-2 top-2 z-10">{action}</div>}
        {soldOut && <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px]" />}
      </div>

      {/* Thumbnails (only when there is more than one image) */}
      {gallery.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto border-b border-border bg-muted/20 p-2">
          {gallery.map((img, i) => (
            <button
              key={`${img}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1} of ${name}`}
              aria-pressed={i === active}
              className={cn(
                'h-9 w-9 shrink-0 overflow-hidden rounded-md border transition-all',
                i === active ? 'border-primary ring-2 ring-primary/40' : 'border-border opacity-70 hover:opacity-100'
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`${name} thumbnail ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PurchasePage() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // This screen is mounted under both /admin and /dashboard, and middleware.ts
  // gates those by role - so keep the cart link inside the current area rather
  // than sending staff to an admin URL they cannot open.
  const cartHref = pathname?.startsWith('/dashboard') ? '/dashboard/cart' : '/admin/cart';
  const createOrderMutation = useCreateOrder();
  const [customerId, setCustomerId] = useState('');
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Catalog data + server-side paging, mirroring the ProductList listing.
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);

  const [filterParams, setFilterParams] = useState<ProductFilterParams>({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || null,
    categoryId: searchParams.get('categoryId') || '',
    startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!).toISOString() : undefined,
    endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!).toISOString() : undefined,
    page: +(searchParams.get('page') || 1),
    recordPerPage: +(searchParams.get('recordPerPage') || config.recordPerPage),
  });

  const getAllProductsResponse = useGetAllProducts(filterParams);
  const isLoading = getAllProductsResponse.isLoading;

  useEffect(() => {
    if (getAllProductsResponse.isSuccess && getAllProductsResponse.data?.data?.data) {
      setProducts(getAllProductsResponse.data.data.data.data ?? []);
      setRecordCount(getAllProductsResponse.data.data.data.totalRecord ?? 0);
    }
  }, [getAllProductsResponse.isSuccess, getAllProductsResponse.data?.data?.data]);

  // Headless table instance — drives the shared filter + pagination controls;
  // the catalog itself renders as cards, not table rows (columns stay empty).
  const { sorting, onSortingChange } = useTanstackTableSorting<ProductDto>('', 'desc');
  const { onPaginationChange, pagination } = useTanstackTablePagination(filterParams.recordPerPage);

  const table = useCustomDataTable<ProductDto, unknown>({
    columns: [],
    data: products,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil((recordCount || 0) / (filterParams.recordPerPage || 1)),
    pagination,
    sorting,
    onPaginationChange,
    onSortingChange,
  });

  useEffect(() => {
    setFilterParams((prev) => ({
      ...prev,
      page: pagination.pageIndex + 1,
      recordPerPage: pagination.pageSize,
    }));
  }, [pagination]);

  const resetForm = () => {
    setFilterParams({
      search: undefined,
      status: null,
      categoryId: '',
      startDate: undefined,
      endDate: undefined,
      page: 1,
      recordPerPage: config.recordPerPage,
    });
  };

  /**
   * The whole wishlist in one request, so each card can render its heart from a lookup
   * instead of asking `/wishlists/has/:productId` 25 times per page.
   *
   * `userId` is sent explicitly: the API only pins plain customers to their own list and
   * treats ADMIN/STAFF as staff, who would otherwise get every user's saved products and
   * see hearts filled for rows that are not theirs.
   */
  const { currentUser } = useGetCurrentUser();
  const { data: wishlistResponse } = useGetAllWishlists(
    { userId: currentUser?.usersId, showAllRecords: true },
    !!currentUser?.usersId
  );

  const wishlistedProductIds = useMemo(
    () => new Set((wishlistResponse?.data?.data?.data ?? []).map((entry) => entry.productId)),
    [wishlistResponse]
  );

  // Customers available to sell to (users with the USER role).
  const { data: customersResponse } = useGetAllUserList({ role: Roles.USER, showAllRecords: true });
  const customerOptions = useMemo(
    () =>
      (customersResponse?.data?.data?.data || [])
        .map((c) => {
          // The users API returns the GUID under `userId` (the Prisma column);
          // the DTO mislabels it as `usersId`, so read both defensively.
          const id = ((c as any).userId ?? (c as any).usersId ?? '') as string;
          return { label: c.email ? `${c.name} (${c.email})` : c.name, value: id };
        })
        .filter((o) => o.value),
    [customersResponse]
  );

  const form = useForm<CheckoutFormValues>({
    resolver: yupResolver(CheckoutSchema),
    defaultValues: { discount: 0, tax: 0, shippingCost: 0, notes: '' },
  });

  // The products API returns the current price under `currentPrice.sellingPrice`,
  // not as a flat `price` field — resolve it safely here.
  const getSellingPrice = (p: ProductDto): number => p.currentPrice?.sellingPrice ?? p.price ?? 0;

  // The cart lives on the server and belongs to the signed-in operator. The
  // selected customer is only attached to the order at checkout, which is how the
  // previous local-state version behaved too.
  const { data: cartResponse, isLoading: isCartLoading } = useGetActiveCart();
  const serverCart = cartResponse?.data?.data ?? null;

  /** Stock by product for the currently loaded catalog page. */
  const stockByProduct = useMemo(() => {
    const map = new Map<number, number>();
    products.forEach((p) => map.set(p.id, p.stock));
    return map;
  }, [products]);

  /**
   * Keyed by productId so the catalog can ask "how many of this are in the cart?"
   * in one lookup. A cart line whose product is not on the current catalog page
   * has no known stock ceiling, so treat it as unbounded rather than blocking the
   * stepper on a value we do not have.
   */
  const cart = useMemo<Record<number, CartLine>>(() => {
    const lines: Record<number, CartLine> = {};
    (serverCart?.items ?? []).forEach((item) => {
      lines[item.productId] = {
        id: item.productId,
        name: item.productName,
        price: item.unitPrice ?? 0,
        cartQuantity: item.quantity,
        stock: stockByProduct.get(item.productId) ?? Number.POSITIVE_INFINITY,
        images: item.productImages ?? [],
      };
    });
    return lines;
  }, [serverCart, stockByProduct]);

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const totalItemsCount = serverCart?.totalQuantity ?? 0;
  const totalAmount = serverCart?.totalAmount ?? 0;

  const addToCartMutation = useAddToCart();
  const updateCartQuantityMutation = useUpdateCartQuantity();
  const removeFromCartMutation = useRemoveFromCart();
  const clearCartMutation = useClearCart();

  const isCartMutating =
    addToCartMutation.isPending || updateCartQuantityMutation.isPending || removeFromCartMutation.isPending || clearCartMutation.isPending;

  /** Surfaces a failed cart mutation instead of leaving the UI silently unchanged. */
  const reportCartError = (response: unknown, fallbackTitle: string) => {
    const error = unitOfService.ErrorHandlerService.getErrorMessage(response as never);
    toast({ variant: 'destructive', title: fallbackTitle, description: <span>{error}</span> });
  };

  const runCartAction = async (action: () => Promise<any>, okStatus: number, failureTitle: string) => {
    try {
      const response = await action();
      if (!response || response.status !== okStatus) reportCartError(response, failureTitle);
    } catch (error) {
      reportCartError(error, failureTitle);
    }
  };

  // `product` may be a catalog ProductDto or an existing cart line; both carry the
  // id and stock this needs.
  const handleAddToCart = async (product: { id: number; stock: number }) => {
    const current = cart[product.id]?.cartQuantity ?? 0;
    if (current + 1 > product.stock) {
      toast({ variant: 'destructive', title: 'Out of stock', description: `Cannot add more than ${product.stock} items.` });
      return;
    }
    await runCartAction(() => addToCartMutation.mutateAsync({ productIds: [product.id] }), 201, 'Could not add to cart');
  };

  const handleRemoveFromCart = async (productId: number) => {
    const current = cart[productId]?.cartQuantity ?? 0;
    if (current === 0) return;

    // Quantity 0 is how the API removes a line, so one endpoint covers both.
    await runCartAction(() => updateCartQuantityMutation.mutateAsync({ productId, model: { quantity: current - 1 } }), 200, 'Could not update cart');
  };

  const handleDeleteFromCart = async (productId: number) => {
    await runCartAction(() => removeFromCartMutation.mutateAsync({ productId }), 200, 'Could not remove item');
  };

  const handleClearCart = async () => {
    if (cartItems.length === 0) return;
    await runCartAction(() => clearCartMutation.mutateAsync(undefined), 200, 'Could not clear cart');
  };

  const { discount, tax, shippingCost } = form.watch();
  const grandTotal = totalAmount + (tax || 0) + (shippingCost || 0) - (discount || 0);

  const handleCheckout = async (data: CheckoutFormValues) => {
    if (cartItems.length === 0) return;

    if (!customerId) {
      toast({ variant: 'destructive', title: 'Checkout Failed', description: 'Customer ID is required. Please login or select a customer.' });
      return;
    }

    try {
      const orderPayload = {
        customerId,
        discount: data.discount || 0,
        tax: data.tax || 0,
        shippingCost: data.shippingCost || 0,
        status: OrderStatus.Pending,
        notes: data.notes,
        // Send only product + quantity; the server resolves price and totals.
        items: cartItems.map((item) => ({
          productId: item.id,
          quantity: item.cartQuantity,
        })),
      };

      const response = await createOrderMutation.mutateAsync(orderPayload);
      if (response && (response.status === 201 || response.status === 200)) {
        toast({ variant: 'success', title: 'Order placed successfully' });
        // The order owns the line items now, so empty the persisted cart. If this
        // fails the order still stands, so surface it rather than throwing.
        await runCartAction(() => clearCartMutation.mutateAsync(undefined), 200, 'Order placed, but the cart could not be emptied');
        setCustomerId('');
        form.reset();
        setMobileCartOpen(false);
      } else {
        const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
        toast({ variant: 'destructive', title: 'Checkout Failed', description: <span>{error}</span> });
      }
    } catch (error: any) {
      const errorMessage = unitOfService.ErrorHandlerService.getErrorMessage(error);
      toast({ variant: 'destructive', title: 'Error', description: <span>{errorMessage || error.message || 'Unknown error occurred'}</span> });
    }
  };

  /* ----------------------------- Sub-renderers ----------------------------- */

  const renderStockBadge = (product: ProductDto) => {
    const isLowStock = product.stock <= (product.lowStockThreshold || 5);
    if (product.stock <= 0) {
      return (
        <Badge
          variant="outline"
          className="border-destructive/30 bg-destructive/10 text-destructive gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
          Sold out
        </Badge>
      );
    }
    if (isLowStock) {
      return (
        <Badge
          variant="outline"
          className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Low · {product.stock}
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {product.stock} in stock
      </Badge>
    );
  };

  const renderProductGrid = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden rounded-2xl border-border">
              <Skeleton className="h-40 w-full rounded-none" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </Card>
          ))}
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <div className="rounded-full bg-muted p-4 text-muted-foreground">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground">No products found</p>
            <p className="text-xs text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {products.map((product) => {
          const inCartQty = cart[product.id]?.cartQuantity || 0;
          const soldOut = product.stock <= 0;

          return (
            <Card
              key={product.id}
              className="group flex flex-col overflow-hidden rounded-2xl border-border bg-card shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-md !p-0"
            >
              <ProductCardImage
                images={product.images}
                name={product.name}
                soldOut={soldOut}
                badge={renderStockBadge(product)}
                action={
                  <WishlistToggle
                    productId={product.id}
                    productName={product.name}
                    inWishlist={wishlistedProductIds.has(product.id)}
                    className="rounded-full bg-background/90 shadow-sm backdrop-blur hover:bg-background"
                  />
                }
              />

              {/* Body */}
              <div className="flex flex-1 flex-col p-4">
                <CardTitle className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                  {product.name}
                </CardTitle>

                <div className="mb-2 mt-1">
                  <ProductRating productId={product.id} />
                </div>

                <ProductVariantsStrip variants={product.variants} />

                <div className="mt-auto flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Price</span>
                    <span className="text-lg font-bold text-foreground">${getSellingPrice(product).toFixed(2)}</span>
                  </div>

                  {inCartQty > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <QuantityStepper
                        quantity={inCartQty}
                        onDecrease={() => handleRemoveFromCart(product.id)}
                        onIncrease={() => handleAddToCart(product)}
                        canIncrease={inCartQty < product.stock && !isCartMutating}
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 shrink-0 rounded-lg"
                        onClick={() => handleAddToCart(product)}
                        disabled={inCartQty >= product.stock || isCartMutating}
                        title={inCartQty >= product.stock ? 'No more stock available' : `Add another ${product.name} to cart`}
                        aria-label={`Add another ${product.name} to cart`}
                        type="button"
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="icon"
                      className="h-9 w-9 rounded-lg"
                      onClick={() => handleAddToCart(product)}
                      disabled={soldOut || isCartMutating}
                      title={soldOut ? 'Out of stock' : `Add ${product.name} to cart`}
                      aria-label={soldOut ? `${product.name} is out of stock` : `Add ${product.name} to cart`}
                      type="button"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderCartPanel = (variant: 'sidebar' | 'sheet') => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <ShoppingCart className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Current Order</h3>
            <p className="text-xs text-muted-foreground">
              {totalItemsCount} item{totalItemsCount === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        {variant === 'sheet' ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setMobileCartOpen(false)} type="button">
            <X className="h-4 w-4" />
          </Button>
        ) : (
          cartItems.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 rounded-lg text-xs text-muted-foreground hover:text-destructive"
              onClick={handleClearCart}
              type="button"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
          )
        )}
      </div>

      {/* Items */}
      <ScrollArea className="flex-1">
        {cartItems.length > 0 ? (
          <div className="space-y-2 p-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-background p-2.5 transition-colors hover:border-border"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
                  {item.images && item.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.images[0]} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-5 w-5 text-muted-foreground/40" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ${item.price.toFixed(2)} · <span className="font-medium text-foreground">${(item.price * item.cartQuantity).toFixed(2)}</span>
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <QuantityStepper
                      quantity={item.cartQuantity}
                      onDecrease={() => handleRemoveFromCart(item.id)}
                      onIncrease={() => handleAddToCart(item)}
                      canIncrease={item.cartQuantity < item.stock && !isCartMutating}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDeleteFromCart(item.id)}
                      disabled={isCartMutating}
                      type="button"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : isCartLoading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="rounded-full bg-muted p-4 text-muted-foreground">
              <ShoppingCart className="h-7 w-7" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">Your cart is empty</p>
              <p className="text-xs text-muted-foreground">Add products from the catalog to get started.</p>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Checkout */}
      <div className="border-t border-border bg-muted/30 p-4">
        <div className="mb-3 space-y-1.5">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            Customer <span className="text-destructive">*</span>
          </label>
          <SelectSearch
            placeholder="Select a customer"
            buttonClass="w-full h-9 rounded-lg text-sm bg-background font-normal"
            items={customerOptions}
            value={customerId}
            valueType="string"
            containerName={`pos-customer-${variant}`}
            onChange={(value) => setCustomerId(value ? String(value) : '')}
          />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCheckout)} className="space-y-3" autoComplete="off">
            <div className="grid grid-cols-2 gap-2.5">
              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <Percent className="h-3.5 w-3.5" />
                      Discount
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="h-9 rounded-lg bg-background text-sm"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tax"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <Landmark className="h-3.5 w-3.5" />
                      Tax
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="h-9 rounded-lg bg-background text-sm"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    Notes
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add special instructions..."
                      {...field}
                      value={field.value ?? ''}
                      className="min-h-[56px] rounded-lg bg-background py-2 text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Totals */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-medium text-foreground">${totalAmount.toFixed(2)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Tax</span>
                  <span>+${tax.toFixed(2)}</span>
                </div>
              )}
              {shippingCost > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Shipping</span>
                  <span>+${shippingCost.toFixed(2)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                  <span>Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-sm font-semibold text-foreground">Total</span>
                <span className="text-2xl font-bold text-primary">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <Button
              className="h-11 w-full rounded-lg text-sm font-bold"
              disabled={cartItems.length === 0 || !customerId || createOrderMutation.isPending}
              type="submit"
              loading={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? 'Processing...' : 'Complete Purchase'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );

  /* -------------------------------- Layout --------------------------------- */

  if (getAllProductsResponse.isError) {
    return <div className="py-10 text-center text-destructive">Error loading products. Please try again.</div>;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Point of Sale"
        description="Select products and complete a purchase"
        actionText={totalItemsCount > 0 ? `Cart (${totalItemsCount})` : 'Cart'}
        href={cartHref}
        icon={ShoppingCart}
      />

      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <ProductListFilter
            table={table}
            resetForm={resetForm}
            showStatus={false}
            showDateRange={false}
            onTextChange={(value) => setFilterParams((prev) => ({ ...prev, search: value || undefined, page: 1 }))}
            onCategoryTypeChange={(value) => setFilterParams((prev) => ({ ...prev, categoryId: value || undefined }))}
          />
        </div>

        {/* Mobile-only cart trigger */}
        <Button className="relative h-10 rounded-lg lg:hidden" onClick={() => setMobileCartOpen(true)} type="button">
          <ShoppingCart className="h-4 w-4" />
          {totalItemsCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {totalItemsCount}
            </span>
          )}
        </Button>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-6">
        <div className="flex min-w-0 flex-col gap-4">
          {/* {!isLoading && recordCount > 0 && (
            <p className="text-xs font-medium text-muted-foreground">
              <span className="font-semibold text-foreground">{recordCount}</span> product{recordCount === 1 ? '' : 's'} found
            </p>
          )} */}
          <div className="space-y-2">
            {/* <DataTablePagination table={table} totalRecord={recordCount} loading={isLoading} /> */}
            {renderProductGrid()}
            <DataTablePagination table={table} totalRecord={recordCount} loading={isLoading} />
          </div>
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden">
          <Card className="sticky top-4 h-[calc(100vh-7rem)] overflow-hidden rounded-2xl border-border bg-card p-0 shadow-sm">
            {renderCartPanel('sidebar')}
          </Card>
        </aside>
      </div>

      {/* Mobile cart sheet */}
      <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-md [&>button]:hidden">
          <SheetTitle className="sr-only">Current Order</SheetTitle>
          {renderCartPanel('sheet')}
        </SheetContent>
      </Sheet>
    </div>
  );
}
