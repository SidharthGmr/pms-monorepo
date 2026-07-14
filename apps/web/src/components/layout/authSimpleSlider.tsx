'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PackageSearch, ShieldCheck, Store } from 'lucide-react';
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

const FEATURES = [
  { icon: Store, text: 'Run every store from a single dashboard' },
  { icon: PackageSearch, text: 'Track stock and orders in real time' },
  { icon: ShieldCheck, text: 'Keep access safe with role-based permissions' },
];

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

      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left branding panel */}
        <section className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16" aria-hidden="true">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary via-primary to-secondary" />
          <div className="absolute inset-0 -z-10 bg-black/25" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.18),transparent_35%),radial-gradient(circle_at_85%_25%,rgba(255,255,255,0.12),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(0,0,0,0.25),transparent_45%)]" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:48px_48px]" />

          <div className="inline-flex w-fit items-center rounded-xl bg-white p-3 backdrop-blur-sm">
            <Logo className="h-auto w-[140px]" />
          </div>

          <div className="max-w-md">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white xl:text-4xl">Everything your stores need, in one place.</h1>
            <p className="mt-4 text-[15px] leading-relaxed text-white/80">
              Products, inventory, orders and staff — managed from a single, unified system.
            </p>

            <ul className="mt-8 space-y-4">
              {FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-white/90">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                    <Icon className="h-4 w-4 text-white" />
                  </span>
                  <span className="text-sm font-medium">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-white/60">© {new Date().getFullYear()} All rights reserved.</p>
        </section>

        {/* Right form panel */}
        <section className="relative flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <Card className="w-full max-w-md border-border/50 shadow-xl">
            <CardHeader className="space-y-2 text-center">
              <Logo className="mx-auto h-auto w-[150px] md:w-[180px] lg:hidden" />
              <CardTitle className="text-3xl font-semibold tracking-tight">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              {formComponent}
              <small className="mt-4 block text-center text-muted-foreground">By continuing, you agree to our terms and privacy policy.</small>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
