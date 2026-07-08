'use client';
import * as React from 'react';
import Link from 'next/link';

import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter, FaYoutube } from 'react-icons/fa6';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CardDescription } from '../ui/card';

const Company: { title: string; href: string }[] = [
  { title: 'About Us', href: 'https://www.repugen.com/about-us' },
  { title: 'FAQs', href: 'https://www.repugen.com/faqs' },
  { title: 'Contact Us', href: 'https://www.repugen.com/contact' },
];

const Products: { title: string; href: string }[] = [
  { title: 'Hospitals', href: 'https://www.repugen.com/hospital-reputation-management' },
  { title: 'Private Practice', href: 'https://www.repugen.com/hospital-reputation-management' },
];

const Resources: { title: string; href: string }[] = [
  { title: 'Blog', href: 'https://www.repugen.com/blog' },
  { title: 'eBooks', href: 'https://www.repugen.com/our-resources#eBookssec' },
  { title: 'Webinars', href: 'https://www.repugen.com/webinars' },
];
const SocialMedia: { icon: React.ElementType; title: string; href: string }[] = [
  { icon: FaFacebookF, title: 'Facebook', href: 'https://www.facebook.com/RepuGen' },
  { icon: FaXTwitter, title: 'Twitter', href: 'https://twitter.com/RepuGen_' },
  { icon: FaYoutube, title: 'Youtube', href: 'https://www.youtube.com/channel/UCVFelCQDblEitc4u3-ZURbg' },
  { icon: FaInstagram, title: 'Instagram', href: 'https://www.instagram.com/repugen.official/' },
  { icon: FaLinkedinIn, title: 'LinkedIn', href: 'https://www.linkedin.com/company/repugen' },
];

export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black pt-20 pb-10 text-gray-400 border-t border-gray-800">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-12 lg:gap-8 mb-16">
          <div className="xl:col-span-4">
            <Link href="/" className="inline-block mb-6" title="shotMail">
              <div className="text-2xl font-bold text-white tracking-tight">
                shot<span className="text-blue-500">Mail</span>
              </div>
            </Link>
            <CardDescription>
              At shotMail, we believe powerful communication should be simple. We saw teams struggling with clunky interfaces and fragmented data that
              held back their growth.
            </CardDescription>

            <div className="flex gap-4">
              {SocialMedia.map((item, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        target="_blank"
                        className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800 text-gray-400 hover:bg-blue-500/20 hover:text-blue-400 transition-all duration-300 transform hover:scale-105"
                      >
                        {React.createElement(item.icon, { className: 'w-5 h-5' })}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>{item.title}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>

          <div className="xl:col-span-2 md:col-span-1">
            <FooterList heading="Company" items={Company} />
          </div>
          <div className="xl:col-span-3 md:col-span-1">
            <FooterList heading="Products" items={Products} />
          </div>
          <div className="xl:col-span-3 md:col-span-1">
            <FooterList heading="Resources" items={Resources} />
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} shotMail. All rights reserved.</p>
          </div>

          <div className="flex items-center gap-8 text-sm font-medium">
            <Link href="/privacy-statement" className="">
              Privacy Policy
            </Link>
            <Link href="#" className="">
              Terms of Service
            </Link>
            <Link href="#" className="">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterList({ heading, items }: { heading: string; items: { title: string; href: string }[] }) {
  return (
    <div>
      <h3 className="font-semibold text-white tracking-wide uppercase text-sm mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent w-fit">
        {heading}
      </h3>
      <ul className="flex flex-col gap-4">
        {items.map((item, index) => (
          <li key={index}>
            <Link
              href={item.href}
              title={item.title}
              className="text-gray-400 hover:text-white hover:translate-x-1 transition-all duration-300 inline-block text-[15px]"
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
