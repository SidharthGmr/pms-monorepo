'use client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { useAddToCart } from '@/hooks/service-hooks/useCartService';
import { useGetCatalogProduct, useGetCatalogProducts } from '@/hooks/service-hooks/useCatalogService';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { useLocale } from '@/i18n/locale-provider';
import { cn } from '@/lib/utils';
import { CatalogProductDto, CatalogVariantDto } from '@pms/types';
import { ChevronRight, ImageOff, Loader2, Mail, MapPin, Minus, PackageSearch, Phone, Plus, ShoppingCart, Star, Store } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import CatalogProductCard from './product-card';
import ProductReviews from './product-reviews';

/**
 * Demo PDP for the catalog API. Variant choice works the standard e-commerce way: one selector
 * per attribute, built from the variants' resolved attributes; a combination nobody stocks is
 * disabled rather than hidden, and the gallery, price, stock line and SKU all follow the
 * selected variant. The buy box uses the existing cart hook untouched - carts need a signed-in
 * user, so guests get a sign-in link where the button would be.
 */

interface AttributeGroup {
  attributeId: number;
  name: string;
  entries: { entryId: number; value: string; colorHex: string | null }[];
}

const buildGroups = (variants: CatalogVariantDto[]): AttributeGroup[] => {
  const groups = new Map<number, AttributeGroup>();
  for (const variant of variants) {
    for (const attribute of variant.attributes) {
      const group = groups.get(attribute.attributeId) ?? { attributeId: attribute.attributeId, name: attribute.attributeName, entries: [] };
      if (!group.entries.some((entry) => entry.entryId === attribute.entryId)) {
        group.entries.push({ entryId: attribute.entryId, value: attribute.value, colorHex: attribute.colorHex });
      }
      groups.set(attribute.attributeId, group);
    }
  }
  return Array.from(groups.values());
};

const variantHas = (variant: CatalogVariantDto, attributeId: number, entryId: number) =>
  variant.attributes.some((attribute) => attribute.attributeId === attributeId && attribute.entryId === entryId);

function Gallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[Math.min(active, Math.max(images.length - 1, 0))];

  return (
    <div className="space-y-3">
      <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border bg-muted/30">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current} alt={name} className="h-full w-full object-cover" />
        ) : (
          <ImageOff className="h-10 w-10 text-muted-foreground/40" />
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Image ${index + 1}`}
              className={cn('h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors', index === active ? 'border-primary' : 'border-border/60 hover:border-muted-foreground')}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BuyBox({ product }: { product: CatalogProductDto }) {
  const { formatCurrency } = useLocale();
  const { currentUser } = useGetCurrentUser();
  const addToCart = useAddToCart();

  const groups = useMemo(() => buildGroups(product.variants), [product.variants]);
  const [selection, setSelection] = useState<Record<number, number>>(() => {
    const first = product.variants.find((variant) => variant.inStock) ?? product.variants[0];
    return Object.fromEntries((first?.attributes ?? []).map((attribute) => [attribute.attributeId, attribute.entryId]));
  });
  const [quantity, setQuantity] = useState(1);

  const selected = useMemo(
    () => product.variants.find((variant) => groups.every((group) => variantHas(variant, group.attributeId, selection[group.attributeId]))) ?? null,
    [product.variants, groups, selection]
  );

  // An entry stays clickable when some variant combines it with the OTHER current picks;
  // otherwise it renders disabled, the way size charts grey out a sold-out combination.
  const isAvailable = (attributeId: number, entryId: number) =>
    product.variants.some((variant) => variantHas(variant, attributeId, entryId) && groups.every((group) => group.attributeId === attributeId || variantHas(variant, group.attributeId, selection[group.attributeId])));

  const pick = (attributeId: number, entryId: number) => {
    setSelection((current) => ({ ...current, [attributeId]: entryId }));
    setQuantity(1);
  };

  const price = selected?.payablePrice ?? product.minPrice;
  const showCompareAt = selected?.isOffer && selected.compareAtPrice != null ? selected.compareAtPrice : null;
  const maxQuantity = Math.max(selected?.stock ?? 0, 0);

  const add = async () => {
    if (!selected) return;
    const response = await addToCart.mutateAsync({ variantIds: [selected.id] });
    if (response && response.status === 201) {
      toast({ variant: 'success', title: 'Added to cart', description: <span>{selected.name}</span> });
    } else {
      toast({ variant: 'destructive', title: 'Could not add to cart', description: <span>Please try again.</span> });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{product.brandName ?? product.categoryName}</span>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{product.name}</h1>
        <div className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
          {product.rating != null && (
            <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
              <Star className="h-3.5 w-3.5 fill-current" />
              {product.rating.toFixed(1)}
            </span>
          )}
          {product.ratingCount > 0 && <span>({product.ratingCount} ratings)</span>}
          <span>· {product.categoryName}</span>
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className={cn('text-3xl font-bold tabular-nums', showCompareAt != null && 'text-rose-600 dark:text-rose-400')}>
          {price != null ? formatCurrency(price) : 'Price on request'}
        </span>
        {showCompareAt != null && <span className="text-base tabular-nums text-muted-foreground line-through">{formatCurrency(showCompareAt)}</span>}
        {selected?.isOffer && selected.offerPrice != null && (
          <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Offer</span>
        )}
      </div>

      {groups.map((group) => (
        <div key={group.attributeId}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.name}
            <span className="ml-1.5 font-normal normal-case text-foreground">{group.entries.find((entry) => entry.entryId === selection[group.attributeId])?.value}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {group.entries.map((entry) => {
              const active = selection[group.attributeId] === entry.entryId;
              const available = isAvailable(group.attributeId, entry.entryId);
              return entry.colorHex ? (
                <button
                  key={entry.entryId}
                  type="button"
                  title={entry.value}
                  aria-pressed={active}
                  onClick={() => pick(group.attributeId, entry.entryId)}
                  className={cn(
                    'h-9 w-9 rounded-full border-2 transition-all',
                    active ? 'border-primary ring-2 ring-primary/30' : 'border-border/70 hover:border-muted-foreground',
                    !available && 'opacity-30'
                  )}
                  style={{ backgroundColor: entry.colorHex }}
                >
                  <span className="sr-only">{entry.value}</span>
                </button>
              ) : (
                <button
                  key={entry.entryId}
                  type="button"
                  aria-pressed={active}
                  onClick={() => pick(group.attributeId, entry.entryId)}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                    active ? 'border-primary bg-primary text-primary-foreground' : 'border-border/70 hover:border-muted-foreground',
                    !available && 'opacity-40'
                  )}
                >
                  {entry.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="text-sm">
        {selected ? (
          selected.inStock ? (
            <span className="font-medium text-emerald-600 dark:text-emerald-400">In stock · {selected.stock} available</span>
          ) : (
            <span className="font-medium text-destructive">Out of stock</span>
          )
        ) : (
          <span className="font-medium text-muted-foreground">This combination is not available</span>
        )}
        {selected && <span className="ml-2 text-xs text-muted-foreground">SKU {selected.sku}</span>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center rounded-lg border">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-10 px-2 text-center text-sm font-semibold tabular-nums">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(Math.max(maxQuantity, 1), q + 1))}
            disabled={!selected || quantity >= maxQuantity}
            aria-label="Increase quantity"
            className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </span>

        {currentUser ? (
          <Button size="lg" className="flex-1 gap-2 sm:flex-none sm:px-10" disabled={!selected || !selected.inStock || addToCart.isPending} onClick={add}>
            {addToCart.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
            Add to cart
          </Button>
        ) : (
          <Button asChild size="lg" className="flex-1 gap-2 sm:flex-none sm:px-10">
            <Link href="/login">
              <ShoppingCart className="h-4 w-4" />
              Sign in to add to cart
            </Link>
          </Button>
        )}
      </div>

      {product.shortDescription && <p className="text-sm leading-relaxed text-muted-foreground">{product.shortDescription}</p>}
    </div>
  );
}

export default function CatalogProductDetail({ slug }: { slug: string }) {
  const productQuery = useGetCatalogProduct(slug);
  const response = productQuery.data;
  const product = response?.data?.data;
  const notFound = response != null && response.status !== 200;

  const relatedQuery = useGetCatalogProducts({ categoryIds: product ? [product.categoryId] : undefined, recordPerPage: 5 }, !!product);
  const related = (relatedQuery.data?.data?.data?.data ?? []).filter((item) => item.id !== product?.id).slice(0, 4);

  if (productQuery.isPending) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8" aria-busy="true">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-11 w-56" />
          </div>
        </div>
      </div>
    );
  }

  if (productQuery.isError || notFound || !product) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-16">
        <Card className="py-16 text-center">
          <PackageSearch className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-semibold">Product not found</p>
          <p className="mt-1 text-xs text-muted-foreground">It may have been unpublished or removed.</p>
          <Button asChild variant="outline" size="sm" className="mt-5">
            <Link href="/products">Back to the catalog</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const images = Array.from(new Set([...product.variants.flatMap((variant) => variant.images ?? []), ...(product.images ?? [])]));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <nav className="mb-5 flex items-center gap-1 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/products" className="hover:text-foreground hover:underline">
          Shop the catalog
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span>{product.categoryName}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate font-medium text-foreground">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Gallery images={images} name={product.name} />
        <BuyBox product={product} />
      </div>

      {product.description && (
        <section className="mt-10">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">About this product</h2>
          <p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed">{product.description}</p>
        </section>
      )}

      <ProductDetails product={product} />

      {product.store && <StoreDetails store={product.store} />}

      <ProductReviews productId={product.id} />

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-bold tracking-tight">More in {product.categoryName}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {related.map((item) => (
              <CatalogProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
// The marketplace-style spec sheet: product-level facts plus every attribute's available
// values, derived from the variants so it always matches what the selectors offer.
function ProductDetails({ product }: { product: CatalogProductDto }) {
  const groups = buildGroups(product.variants);
  const skus = product.variants.map((variant) => variant.sku);
  const rows: { label: string; value: string }[] = [
    ...(product.brandName ? [{ label: 'Brand', value: product.brandName }] : []),
    { label: 'Category', value: product.categoryName },
    ...groups.map((group) => ({ label: group.name, value: group.entries.map((entry) => entry.value).join(', ') })),
    { label: 'Variants', value: String(product.totalVariants) },
    { label: skus.length === 1 ? 'SKU' : 'SKUs', value: skus.join(', ') },
  ];

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Details</h2>
      <Card className="max-w-3xl p-0 md:p-0">
        <dl className="divide-y divide-border/60">
          {rows.map((row) => (
            <div key={row.label} className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 px-4 py-2.5 text-sm sm:grid-cols-[160px_minmax(0,1fr)]">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="min-w-0 break-words font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </section>
  );
}

function StoreDetails({ store }: { store: NonNullable<CatalogProductDto['store']> }) {
  const rows = [
    { icon: MapPin, value: store.address },
    { icon: Phone, value: store.phone },
    { icon: Mail, value: store.email },
  ].filter((row) => row.value);

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Store details</h2>
      <Card className="max-w-3xl p-4 md:p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Store className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Sold by</p>
            <p className="truncate text-sm font-semibold">{store.name}</p>
          </div>
        </div>
        {rows.length > 0 && (
          <ul className="mt-3 space-y-1.5 border-t border-border/60 pt-3">
            {rows.map((row) => (
              <li key={row.value} className="flex items-center gap-2 text-sm text-muted-foreground">
                <row.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 break-words">{row.value}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
