'use client';

import EmailTemplatesEditor from '@/components/features/settings/email-tab';
import InvoiceTemplates from '@/components/features/settings/invoice-templates';
import SettingsSkeleton from '@/components/skelton/settings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetSettings } from '@/hooks/service-hooks/useSettingService';
import { cn } from '@/lib/utils';
import { AlertCircle, FileText, Mail, Settings as SettingsIcon, SlidersHorizontal, Store, UserCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import AdminProfilePage from '@/components/features/profile/AdminProfilePage';
import PreferencesTab from './preferences-tab';
import StoreTab from './store-tab';

const TABS = [
  { key: 'store', label: 'Store Information', icon: Store, hint: 'Business details & logo' },
  { key: 'my-profile', label: 'My Profile', icon: UserCircle2, hint: 'Your account details' },
  { key: 'preferences', label: 'Preferences', icon: SlidersHorizontal, hint: 'Theme, dashboard & language' },
  { key: 'invoice-templates', label: 'Invoice Templates', icon: FileText, hint: 'Pick the invoice layout' },
  { key: 'email-templates', label: 'Email Templates', icon: Mail, hint: 'Emails sent to customers' },
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
            <p className="mt-0.5 text-sm text-white/80">Your store details and logo, the invoice layout, and the emails sent to customers.</p>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="store" orientation="vertical" className="flex w-full flex-col gap-4 lg:flex-row lg:items-start">
        {/* Left: the tab CTAs. A row of pills on small screens, a sticky sidebar from lg up. */}
        <TabsList className="h-auto w-full shrink-0 flex-row items-stretch gap-1 rounded-xl border bg-card p-1.5 text-foreground lg:sticky lg:top-20 lg:w-64 lg:flex-col lg:p-2">
          {TABS.map((item) => (
            <TabsTrigger
              key={item.key}
              value={item.key}
              className="group flex-1 justify-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm sm:text-sm lg:flex-none lg:justify-start lg:px-3.5 lg:py-3"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground group-data-[state=active]:bg-white/15 group-data-[state=active]:text-primary-foreground max-lg:hidden">
                <item.icon className="h-4 w-4" />
              </span>
              <item.icon className="h-4 w-4 lg:hidden" />
              <span className="min-w-0 text-left">
                <span className="block truncate">{item.label}</span>
                <span className="hidden truncate text-[11px] font-normal text-muted-foreground group-data-[state=active]:text-primary-foreground/75 lg:block">
                  {item.hint}
                </span>
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Right: the active tab's component fills the remaining width. */}
        <div className="min-w-0 flex-1">
          <TabsContent value="store" className="mt-0">
            <StoreTab />
          </TabsContent>
          <TabsContent value="my-profile" className="mt-0">
            <AdminProfilePage />
          </TabsContent>
          <TabsContent value="preferences" className="mt-0">
            <PreferencesTab />
          </TabsContent>
          <TabsContent value="invoice-templates" className="mt-0">
            <InvoiceTemplates settings={settings} />
          </TabsContent>
          <TabsContent value="email-templates" className="mt-0">
            <EmailTemplatesEditor />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
