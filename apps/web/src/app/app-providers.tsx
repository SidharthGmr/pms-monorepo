'use client';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import AuthProvider from '@/context/AuthProvider';
import { ThemeProvider } from '@/context/theme-provider';
import TokenRefresher from '@/context/tokenRefresher';
import ReduxStoreProvider from '@/lib/ReduxStoreProvider';
import NextTopLoader from 'nextjs-toploader';
import React, { Suspense } from 'react';
import ReactQueryProvider from './ReactQueryProvider';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NextTopLoader color="#3880b7" showSpinner={false} />
      <ReactQueryProvider>
        <ReduxStoreProvider>
          <AuthProvider>
            <TokenRefresher />
            <ThemeProvider defaultTheme="system" storageKey="tci-ui-theme">
              <TooltipProvider>
                <Suspense>{children}</Suspense>
              </TooltipProvider>
              <Toaster />
            </ThemeProvider>
          </AuthProvider>
        </ReduxStoreProvider>
      </ReactQueryProvider>
    </>
  );
}
