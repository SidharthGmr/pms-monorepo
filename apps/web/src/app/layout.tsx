import '@/app/globals.css';
import config from '@/config';
import type { Metadata, Viewport } from 'next';
import { Noto_Sans_Devanagari, Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import AppProviders from './app-providers';
import PWARegister from '@/components/PWARegister';

// Outfit leads, Plus Jakarta Sans stands in for any glyph it lacks, and Noto Sans Devanagari
// catches the rest - neither Latin face has Devanagari, so Hindi would otherwise fall back to
// whatever the OS happens to ship. Tailwind's `fontFamily.sans` points at these variables, so
// preflight carries them app-wide and the browser picks the face per glyph.
const outfit = Outfit({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

const jakarta = Plus_Jakarta_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
});

const devanagari = Noto_Sans_Devanagari({
  weight: ['400', '500', '600', '700'],
  subsets: ['devanagari'],
  display: 'swap',
  variable: '--font-devanagari',
});

// `manifest` is deliberately absent: app/manifest.ts is a file convention that injects its own
// <link rel="manifest">, and declaring it here as well would be overridden anyway.
export const metadata: Metadata = {
  title: config.appName,
  description: 'Your online store. Every product tracked.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default' as const,
    title: config.appName,
  },
};

// theme_color in the manifest is baked into the Android install and never changes after that;
// this tag is the live one. The four accent themes all keep a white background, so the light
// value covers every theme except dark.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#092a55' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0b' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${jakarta.variable} ${devanagari.variable} font-sans bg-background !pointer-events-auto`}>
        <AppProviders>
          <PWARegister />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
