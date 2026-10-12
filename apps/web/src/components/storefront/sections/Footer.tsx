import { Headphones, Mail, MapPin, Phone } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { BRAND, FOOTER_COLUMNS } from '../theme.config';

export default function Footer() {
  return (
    <footer id="footer" className="bg-storefront-surface text-storefront-surface-foreground">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 space-y-4">
            {/* The light cut of the logo: the standard one is navy and teal, and the navy half
                would disappear into this surface. */}
            <Link href="/" className="inline-block" title={BRAND.name}>
              <Image src="/logo-full-light.png" alt={BRAND.name} width={960} height={223} className="h-9 w-auto object-contain" />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-storefront-surface-muted">{BRAND.tagline}</p>
            <address className="space-y-2 text-sm not-italic text-storefront-surface-muted">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                {BRAND.address}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                {BRAND.phone}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                {BRAND.email}
              </p>
            </address>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title} className="space-y-3">
              <h4 className="text-sm font-semibold text-storefront-surface-heading">{column.title}</h4>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link}>
                    <a href="#top" className="text-sm text-storefront-surface-muted transition-colors hover:text-storefront-surface-heading">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-storefront-surface-border pt-6 text-sm text-storefront-surface-muted sm:flex-row">
          <p>
            © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Headphones className="h-4 w-4" />
            <span className="text-xs">{BRAND.supportNote}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
