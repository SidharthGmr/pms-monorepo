'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import React from 'react';
import Logo from '../common/Logo';

export interface AuthFullPageLayoutProps {
  /** Form component (e.g., SignInForm, SignUpForm) – must accept no props or use a render prop pattern */
  formComponent: React.ReactNode;
  title?: string;
  description?: string;
  /** Optional statistics to display in the left panel */
  stats?: Array<{ value: string; label: string }>;
  className?: string;
}

export default function AuthFullPageLayout({
  formComponent,
  title = 'Welcome back',
  description = 'Login to continue your transcription certification journey.',
  className,
}: AuthFullPageLayoutProps) {
  return (
    <main className={cn('relative min-h-screen overflow-hidden', className)}>
      {/* Background (decorative, hidden from screen readers) */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20 dark:from-primary/10 dark:via-background dark:to-secondary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.2),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.15),transparent_30%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.1),transparent_35%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,oklch(var(--border)/0.05)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="grid min-h-screen lg:grid-cols-1">
        <section className="flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <Card className="w-full max-w-md border-border/50 shadow-xl">
            <CardHeader className="space-y-2 text-center">
              <Logo className="mx-auto h-auto w-[150px] md:w-[180px]" />
              <CardTitle className="text-3xl font-semibold tracking-tight">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              {formComponent}
              <small className="mt-4 text-center text-muted-foreground">By continuing, you agree to our terms and privacy policy.</small>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
