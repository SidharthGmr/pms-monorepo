import '@/app/globals.css';
import type { Metadata } from 'next';
import { Noto_Sans_Devanagari, Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import AppProviders from './app-providers';

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

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME,
  description: 'Your online store. Every product tracked.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${jakarta.variable} ${devanagari.variable} font-sans bg-background !pointer-events-auto`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
