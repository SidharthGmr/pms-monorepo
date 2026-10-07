'use client';

import Blog from './sections/Blog';
import Brands from './sections/Brands';
import CategoryTiles from './sections/CategoryTiles';
import FeaturedProducts from './sections/FeaturedProducts';
import Footer from './sections/Footer';
import Header from './sections/Header';
import Hero from './sections/Hero';
import NewArrivals from './sections/NewArrivals';
import Newsletter from './sections/Newsletter';
import Testimonials from './sections/Testimonials';
import TrustStrip from './sections/TrustStrip';
import UtilityBar from './sections/UtilityBar';
import WidePromo from './sections/WidePromo';

/**
 * The storefront skin: a shop window, not the catalogue. Each section fetches the little it
 * shows and the heavy, filterable product list lives on /products, which the header search and
 * every CTA deep-link into. Copy comes from `theme.config.ts`, so rebranding touches no JSX.
 */
export default function Storefront() {
  return (
    <div id="top" className="min-h-screen bg-background text-foreground antialiased">
      <UtilityBar />
      <Header />
      <Hero />
      <TrustStrip />
      <CategoryTiles />
      <FeaturedProducts />
      <NewArrivals />
      <WidePromo />
      <Testimonials />
      <Blog />
      <Brands />
      <Newsletter />
      <Footer />
    </div>
  );
}
