import { Headphones, Mail, MapPin, Phone, Store } from 'lucide-react';
import { BRAND, FOOTER_COLUMNS } from '../theme.config';

export default function Footer() {
  return (
    <footer id="footer" className="bg-storefront-surface text-storefront-surface-foreground">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Store className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold text-storefront-surface-heading">{BRAND.name}</span>
            </div>
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
