import '@/app/globals.css';
import type { Metadata } from 'next';
import { Quicksand } from 'next/font/google';
import AppProviders from './app-providers';

const quicksand = Quicksand({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: false,
  variable: '--font-quicksand',
});

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME,
  description: process.env.NEXT_PUBLIC_APP_NAME,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${quicksand.variable} bg-background !pointer-events-auto`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
