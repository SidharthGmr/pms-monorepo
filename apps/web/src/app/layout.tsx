import '@/app/globals.css';
import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import AppProviders from './app-providers';

// Outfit leads, Plus Jakarta Sans stands in for any glyph it lacks; Tailwind's
// `fontFamily.sans` points at these variables, so preflight carries them app-wide.
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

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME,
  description: 'Your online store. Every product tracked.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${jakarta.variable} font-sans bg-background !pointer-events-auto`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
