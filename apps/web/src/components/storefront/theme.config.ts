import { BadgeCheck, RotateCcw, Tag, Truck, type LucideIcon } from 'lucide-react';

/**
 * Everything a rebrand touches lives here. Colours are CSS variables in `globals.css`
 * (`--storefront-*`), copy is below - between the two, standing up a new store's skin means
 * editing two files rather than hunting literals through JSX.
 *
 * None of this is CMS-backed yet. Product data comes from the API; the promo tiles,
 * testimonials, blog and brand strip are the blocks to wire to real content next.
 */

export const BRAND = {
  name: 'eKarobar',
  tagline: 'A modern storefront to browse products, check live stock and prices, and order with ease.',
  utilityMessage: 'Free shipping on every prepaid order',
  phone: '+91 0123 456 789',
  email: 'demo@example.com',
  address: 'Mega Store, Centre France',
  supportNote: 'Support available 24/7',
} as const;

export const NAV_LINKS = [
  { label: 'Home', href: '#top' },
  { label: 'Shop', href: '#all-products' },
  { label: 'Popular', href: '#popular' },
  { label: 'New arrivals', href: '#new-arrivals' },
  { label: 'Blog', href: '#blog' },
  { label: 'About us', href: '#footer' },
] as const;

export const HERO = {
  badge: 'Flat 20% discount',
  headline: ['Everything you need,', 'in stock and ready to ship'],
  body: 'Browse the full catalogue with live prices and real stock counts on every SKU.',
  cta: { label: 'Shop now', href: '#all-products' },
} as const;

export const TRUST_ITEMS: ReadonlyArray<{ icon: LucideIcon; label: string }> = [
  { icon: BadgeCheck, label: '100% genuine products' },
  { icon: Truck, label: 'Free domestic shipping' },
  { icon: Tag, label: 'Offers and discounts' },
  { icon: RotateCcw, label: '7 days free returns' },
];

/**
 * `tone` names a token pair, not a palette colour, so the tiles follow whichever theme class
 * is on `<html>`. Written out in full because Tailwind's JIT scans for literal class names.
 */
export const PROMO_TILES = [
  {
    title: 'Big savings on headphones',
    from: '₹2,999',
    badge: 'Up to 30% off',
    tone: 'bg-storefront-promo-1 text-storefront-promo-1-foreground',
  },
  {
    title: 'Best styles for everyday',
    from: '₹1,499',
    badge: 'Up to 20% off',
    tone: 'bg-storefront-promo-2 text-storefront-promo-2-foreground',
  },
  {
    title: 'Home and living picks',
    from: '₹4,999',
    badge: 'Up to 25% off',
    tone: 'bg-storefront-promo-3 text-storefront-promo-3-foreground',
  },
] as const;

export const TESTIMONIALS = [
  {
    quote: 'Reliable product, consistently delivers. Ordering was simple and it arrived ahead of the estimate.',
    name: 'Stefanie Rashford',
    role: 'Founder',
  },
  {
    quote: 'Excellent product, A+ customer service. The team answered every question before I bought.',
    name: 'Augusta Wind',
    role: 'Web Designer',
  },
  {
    quote: 'Impressive quality, durable and reliable. Exactly what was described on the listing.',
    name: 'Reema Ghurde',
    role: 'Manager',
  },
] as const;

export const WIDE_PROMO = {
  eyebrow: 'Discount up to 40% off',
  title: 'Flagship phones, everyday prices',
  body: 'Live stock, transparent pricing and a full history behind every change.',
  cta: { label: 'Shop the deals', href: '#all-products' },
} as const;

export const BLOG_POSTS = [
  {
    date: 'July 3, 2026',
    title: 'The most innovative things happening with online retail',
    excerpt: 'How storefronts are changing as inventory, pricing and fulfilment move closer together.',
  },
  {
    date: 'July 3, 2026',
    title: 'Seven answers to the most frequently asked questions',
    excerpt: 'The questions shoppers ask most often before placing a first order, answered plainly.',
  },
  {
    date: 'July 3, 2026',
    title: 'Meet the people behind the products you buy',
    excerpt: 'A look at the suppliers and makers who keep the shelves stocked week after week.',
  },
] as const;

export const BRANDS = ['EVM', 'HUAWEI', 'CONNECT', 'HACKETT', 'RIYAN', 'VERCELLI'] as const;

export const NEWSLETTER = {
  headline: 'Join our newsletter for ₹100 off',
  placeholder: 'Email address',
  cta: 'Subscribe',
} as const;

export const FOOTER_COLUMNS = [
  { title: 'Your account', links: ['Search', 'About us', 'Delivery information', 'Contact', 'FAQs'] },
  { title: 'Information', links: ['Size chart', 'Shipping', 'Legal notice', 'Delivery', 'Sitemap'] },
  { title: 'Quick links', links: ['Privacy policy', 'Refund policy', 'Shipping policy', 'Terms of service'] },
] as const;

/** The storefront lists sellable SKUs, so sorting is over variant columns, not product ones. */
export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first', sortBy: 'createdAt', sortOrder: 'desc' as const },
  { value: 'sku-asc', label: 'SKU: A to Z', sortBy: 'sku', sortOrder: 'asc' as const },
  { value: 'sku-desc', label: 'SKU: Z to A', sortBy: 'sku', sortOrder: 'desc' as const },
] as const;
