import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import config from '@/config';
import { Metadata } from 'next';
import { RefreshCw, WifiOff } from 'lucide-react';

/**
 * Served from the service worker's cache when a navigation fails. Tailwind and the shadcn
 * primitives are used as everywhere else - the worker precaches this page's stylesheet and
 * fonts alongside the HTML, so the design system survives the network being gone.
 *
 * Two things still cannot: `next/image` (the shared <Logo> fetches a CDN URL through the
 * optimizer) and anything needing hydration, since the JS chunks will not load. Hence the
 * inline brand mark with literal fills, and the inline retry script instead of an onClick -
 * both of which would need a nonce if a CSP header is ever added.
 */

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: `Offline - ${config.appName}`,
  robots: { index: false, follow: false },
};

// Reloads the route the user actually wanted - the URL never changed - and retries on its own
// the moment the connection returns.
const RETRY_SCRIPT = `
  document.getElementById('offline-retry').addEventListener('click', function () { location.reload(); });
  window.addEventListener('online', function () { location.reload(); });
`;

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md border-border/70 shadow-lg">
        <CardContent className="flex flex-col items-center px-7 py-10 text-center">
          <div className="relative mb-6">
            {/* Literal fills, not theme tokens: the mark stays on-brand even if the stylesheet
                is the one thing that failed to come back from the cache. */}
            <svg width="60" height="60" viewBox="0 0 64 64" fill="none" role="img" aria-label={config.appName}>
              <path d="M22 22v-4a10 10 0 0 1 20 0v4" stroke="#092a55" strokeWidth="4" strokeLinecap="round" />
              <path d="M14 24h20v28H22a8 8 0 0 1-8-8V24Z" fill="#092a55" />
              <path d="M34 24h16v20a8 8 0 0 1-8 8h-8V24Z" fill="#02a98f" />
            </svg>
            <span className="absolute -bottom-1 -right-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-destructive text-destructive-foreground">
              <WifiOff className="h-3.5 w-3.5" />
            </span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-foreground">You are offline</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {config.appName} needs a connection to load live stock and orders. Nothing you had open has been lost - reconnect and this page reloads
            itself.
          </p>

          <Button type="button" id="offline-retry" className="mt-6 gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>

          <p className="mt-5 text-xs text-muted-foreground/80">Check your Wi-Fi or mobile data.</p>
        </CardContent>
      </Card>

      <script dangerouslySetInnerHTML={{ __html: RETRY_SCRIPT }} />
    </main>
  );
}
