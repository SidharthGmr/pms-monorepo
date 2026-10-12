'use client';

import Blog from './sections/Blog';
import Brands from './sections/Brands';
import CategoryTiles from './sections/CategoryTiles';
import FeaturedProducts from './sections/FeaturedProducts';

import Hero from './sections/Hero';
import LiveShowcase from './sections/LiveShowcase';
import NewArrivals from './sections/NewArrivals';
import Newsletter from './sections/Newsletter';
import Testimonials from './sections/Testimonials';
import TrustStrip from './sections/TrustStrip';
import WidePromo from './sections/WidePromo';

export default function Storefront() {
  return (
    <div id="top" className="min-h-screen bg-background text-foreground antialiased">
      <Hero />
      <TrustStrip />
      <LiveShowcase />
      <CategoryTiles />
      <FeaturedProducts />
      <NewArrivals />
      <WidePromo />
      <Testimonials />
      <Blog />
      <Brands />
      <Newsletter />
    </div>
  );
}
