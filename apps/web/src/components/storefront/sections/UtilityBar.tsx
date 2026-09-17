import { Phone } from 'lucide-react';
import Link from 'next/link';
import { BRAND } from '../theme.config';

export default function UtilityBar() {
  return (
    <div className="hidden border-b border-border bg-muted/40 py-1.5 text-xs text-muted-foreground md:block">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <span>{BRAND.utilityMessage}</span>
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" />
            Call for order: {BRAND.phone}
          </span>
          <Link href="/login" className="font-medium hover:text-foreground">
            Log in / Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
