'use client';

import EmailTemplatesEditor from '@/components/features/settings/email-tab';
import InvoiceTemplates from '@/components/features/settings/invoice-templates';
import SettingsSkeleton from '@/components/skelton/settings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetSettings } from '@/hooks/service-hooks/useSettingService';
import { cn } from '@/lib/utils';
import { AlertCircle, FileText, Mail, Palette, Settings as SettingsIcon } from 'lucide-react';
import BrandingTab from './branding-tab';
import { Card } from '@/components/ui/card';

const TABS = [
  { key: 'branding', label: 'Branding', icon: Palette },
  { key: 'invoice-templates', label: 'Invoice Templates', icon: FileText },
  { key: 'email-templates', label: 'Email Templates', icon: Mail },
] as const;

export default function SettingsPage() {
  const { data, isLoading, isError } = useGetSettings();
  const settings = data?.data?.data ?? null;
  if (isLoading) {
    return <SettingsSkeleton />;
  }

  if (isError || !settings) {
    return (
      <div className={cn('mt-4 flex items-center gap-3 px-4 py-6 sm:px-5')}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold">Could not load settings</p>
          <p className="text-xs text-muted-foreground">Refresh the page to try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:gap-5">
      <Card className={cn('overflow-hidden bg-gradient-to-br from-primary via-primary to-indigo-700')}>
        <div className="relative flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur">
            <SettingsIcon className="h-6 w-6 text-white" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Settings</h1>
            <p className="mt-0.5 text-sm text-white/80">Your logo and business details, the invoice layout, and the emails sent to customers.</p>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="branding">
        <TabsList className="h-auto w-full justify-start gap-1 rounded-xl border border-border/70 bg-muted/50 p-1 text-foreground">
          {TABS.map((item) => (
            <TabsTrigger
              key={item.key}
              value={item.key}
              className="flex-1 gap-2 rounded-lg px-3 py-2 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm sm:flex-none sm:px-4 sm:text-sm"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="branding">
          <BrandingTab settings={settings} />
        </TabsContent>
        <TabsContent value="invoice-templates">
          <InvoiceTemplates settings={settings} />
        </TabsContent>
        <TabsContent value="email-templates">
          <EmailTemplatesEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
