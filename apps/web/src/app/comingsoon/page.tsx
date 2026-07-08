'use client';
import { FaCopyright } from 'react-icons/fa';
import Link from 'next/link';

export default function ComingSoon() {
  return (
    <div className="container mx-auto px-4">
      <div className="my-10 flex items-center justify-center">
        <div className="title-heading text-center my-auto">
          <h1 className="title-dark text-white text-uppercase mt-2 mb-4 fw-semibold">We are coming soon...</h1>
          <p className="text-white para-desc para-dark mx-auto">
            Find Jobs, Employment & Career Opportunities. Some of the companies weve helped recruit excellent applicants over the years.
          </p>
        </div>
        <div className="text-center">
          <Link href="/" className="inline-block" title="Test"></Link>
        </div>
        <div className="text-center">
          <p className="leading-7 [&:not(:first-child)]:mt-6">
            Copyright <FaCopyright className="inline" /> {new Date().getFullYear()} Test.
            <br className="block md:hidden text-reset" /> All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
