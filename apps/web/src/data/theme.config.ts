import { BadgeCheck, Boxes, ClipboardList, Headphones, History, Mail, MapPin, Phone, RotateCcw, ShieldCheck, ShoppingBag, Tag, Truck, type LucideIcon } from 'lucide-react';

export const BRAND = {
  name: 'Stocklivo',
  tagline: 'Your online store. Every product tracked.',
  utilityMessage: 'Free shipping on every prepaid order',
  phone: '+91 0123 456 789',
  email: 'demo@example.com',
  address: 'Mega Store, Centre France',
  supportNote: 'Support available 24/7',
} as const;

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/products' },
  { label: 'Featured', href: '#featured' },
  { label: 'New arrivals', href: '#new-arrivals' },
  { label: 'Blog', href: '#blog' },
  { label: 'About us', href: '/about-us' },
  { label: 'Contact', href: '/contact-us' },
] as const;

export const HERO = {
  badge: 'New season, new stock',
  headline: ['Everything you need,', 'in stock and ready to ship'],
  body: 'Browse the full catalogue with live prices and real stock counts on every SKU - what you see is what is on the shelf.',
  cta: { label: 'Shop now', href: '/products' },
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

/** Placeholder copy until reviews are wired to the API - `rating` is out of 5. */
export const TESTIMONIALS = [
  {
    quote: 'Reliable product, consistently delivers. Ordering was simple and it arrived ahead of the estimate.',
    name: 'Stefanie Rashford',
    role: 'Founder',
    rating: 5,
  },
  {
    quote: 'Excellent product, A+ customer service. The team answered every question before I bought.',
    name: 'Augusta Wind',
    role: 'Web Designer',
    rating: 5,
  },
  {
    quote: 'Impressive quality, durable and reliable. Exactly what was described on the listing.',
    name: 'Reema Ghurde',
    role: 'Manager',
    rating: 4,
  },
] as const;

export const WIDE_PROMO = {
  eyebrow: 'Live stock, live prices',
  title: 'Flagship picks, everyday prices',
  body: 'What the page shows is what is on the shelf. Prices are the ones being charged right now, and every change before them is still on record.',
  points: ['Real stock counts', 'Dated price history', '100% genuine products'],
  cta: { label: 'Shop the catalogue', href: '/products' },
} as const;

export const BLOG = {
  eyebrow: 'From the shop floor',
  title: 'Our latest blog',
  body: 'Short reads on stock, pricing and getting orders out of the door.',
  cta: { label: 'All posts', href: '#blog' },
} as const;

// `href` is the one field to swap when these become real posts; everything else is display copy.
export const BLOG_POSTS = [
  {
    category: 'Retail',
    date: 'July 3, 2026',
    readMinutes: 6,
    title: 'The most innovative things happening with online retail',
    excerpt: 'How storefronts are changing as inventory, pricing and fulfilment move closer together, and what a small shop can borrow from it.',
    href: '#blog',
  },
  {
    category: 'Guides',
    date: 'June 24, 2026',
    readMinutes: 4,
    title: 'Seven answers to the most frequently asked questions',
    excerpt: 'The questions shoppers ask most often before placing a first order, answered plainly.',
    href: '#blog',
  },
  {
    category: 'Suppliers',
    date: 'June 11, 2026',
    readMinutes: 5,
    title: 'Meet the people behind the products you buy',
    excerpt: 'A look at the suppliers and makers who keep the shelves stocked week after week.',
    href: '#blog',
  },
] as const;

export const BRANDS = ['EVM', 'HUAWEI', 'CONNECT', 'HACKETT', 'RIYAN', 'VERCELLI'] as const;

export const NEWSLETTER = {
  eyebrow: 'Stay in stock',
  headline: 'New arrivals, straight to your inbox',
  body: 'One email when fresh stock lands or a price drops. Nothing else.',
  placeholder: 'you@example.com',
  cta: 'Subscribe',
  note: 'No spam. Unsubscribe whenever you like.',
} as const;

/**
 * The about page says only what the shop actually does - live counts, dated prices, genuine
 * stock. No founding dates, headcounts or customer totals, because none of those are facts
 * this codebase holds.
 */
export const ABOUT = {
  banner: {
    eyebrow: 'Who we are',
    title: 'About us',
    description: 'A shop built around one idea: what the page says is what is on the shelf.',
  },
  story: {
    eyebrow: 'Our story',
    title: 'A catalogue you can trust at a glance',
    paragraphs: [
      'Most online shops show you a product and leave you guessing - is it really in stock, and is this price the one you will actually be charged? We built Stocklivo the other way round. The storefront reads straight from the same inventory the shop floor runs on, so a count on the page is a count on the shelf.',
      'Every price carries its own history. When a price changes, the old one is closed off and dated rather than overwritten, so an order is always priced by the figure that was in force when it was placed. Nothing is quietly rewritten after the fact.',
      'The result is a small promise, kept consistently: no phantom stock, no surprise at checkout, and a clear record behind every number you see.',
    ],
  },
  pillars: [
    { icon: Boxes, title: 'Live stock counts', body: 'Stock moves as orders and deliveries happen, so the number on a product is the number in the building.' },
    { icon: History, title: 'Dated price history', body: 'Every price change is recorded with the period it applied to. Your order is priced by the one that was live when you placed it.' },
    { icon: ShieldCheck, title: 'Genuine products', body: 'Stock is received against a supplier invoice before it can be sold, so what ships is what was bought in.' },
    { icon: RotateCcw, title: 'Returns without a fight', body: 'Seven days to change your mind, and the return lands back on the same record the sale came from.' },
  ],
  steps: [
    { icon: ShoppingBag, title: 'Browse what is really there', body: 'The catalogue lists sellable variants only, each with its current price and stock.' },
    { icon: ClipboardList, title: 'Place the order', body: 'Prices are locked to the order the moment it is raised, and an invoice is issued against it.' },
    { icon: Truck, title: 'Track it to the door', body: 'The order moves through confirmed, shipped and delivered, and the stock count moves with it.' },
  ],
  contact: [
    { icon: MapPin, label: 'Visit us', key: 'address' },
    { icon: Phone, label: 'Call us', key: 'phone' },
    { icon: Mail, label: 'Email us', key: 'email' },
    { icon: Headphones, label: 'Support', key: 'supportNote' },
  ],
  cta: {
    title: 'See the catalogue for yourself',
    body: 'Every product below is priced and counted as of right now.',
    primary: { label: 'Shop the catalogue', href: '/products' },
    secondary: { label: 'Read the blog', href: '/#blog' },
  },
} as const;

export const CONTACT = {
  banner: {
    eyebrow: 'Get in touch',
    title: 'Contact us',
    description: 'A question about an order, a product or the stock behind it - write to us and a real person answers.',
  },
  form: {
    title: 'Send us a message',
    body: 'Fill this in and it lands straight in the shop admin. We reply to the email you give here.',
    cta: 'Send message',
    successTitle: 'Message sent',
    successBody: 'Thanks for writing in. We have your message and will reply to your email shortly.',
  },
  aside: {
    title: 'Other ways to reach us',
    body: 'Prefer to talk? The desk picks up during store hours, and email is answered every day.',
  },
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
