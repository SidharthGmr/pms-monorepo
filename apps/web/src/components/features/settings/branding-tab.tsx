'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useUpdateSettings, useUploadLogo } from '@/hooks/service-hooks/useSettingService';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { SettingsDto } from '@pms/types';
import { AtSign, Building2, ImageOff, Loader2, RotateCcw, Save, Trash2, UploadCloud } from 'lucide-react';
import React, { DragEvent, ReactNode, useRef, useState } from 'react';

const SURFACE = 'rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm';
const ACCEPTED = 'image/png,image/jpeg,image/webp,image/svg+xml';
const MAX_LOGO_MB = 2;

interface BrandingTabProps {
  settings: SettingsDto;
}

function SectionCard({ icon, title, description, children }: { icon: ReactNode; title: string; description?: string; children: ReactNode }) {
  return (
    <section className={cn(SURFACE, 'overflow-hidden')}>
      <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3.5 sm:px-5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold leading-tight">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export default function BrandingTab({ settings }: BrandingTabProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const updateSettings = useUpdateSettings();
  const uploadLogo = useUploadLogo();

  const [logoUrl, setLogoUrl] = useState(settings.logoUrl);
  const [siteName, setSiteName] = useState(settings.siteName);
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploading = uploadLogo.isPending;
  const saving = updateSettings.isPending;

  const dirty = logoUrl !== settings.logoUrl || siteName !== settings.siteName || supportEmail !== settings.supportEmail;
  useUnsavedChangesWarning(dirty);

  const handleFile = async (file: File | undefined) => {
    if (!file || uploading) return;
    if (file.size > MAX_LOGO_MB * 1024 * 1024) {
      toast({ title: 'Logo too large', description: `Choose an image of ${MAX_LOGO_MB}MB or smaller.`, variant: 'destructive' });
      return;
    }

    setProgress(0);
    try {
      const uploaded = await uploadLogo.mutateAsync({ file, onProgress: setProgress });
      setLogoUrl(uploaded.url);
      toast({ title: 'Logo uploaded', description: 'Save to apply it across invoices and emails.' });
    } catch (error) {
      toast({ title: 'Upload failed', description: (error as Error)?.message || 'The logo could not be uploaded.', variant: 'destructive' });
    } finally {
      // Reset so picking the SAME file again still fires onChange.
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const revert = () => {
    setLogoUrl(settings.logoUrl);
    setSiteName(settings.siteName);
    setSupportEmail(settings.supportEmail);
  };

  // The mutation invalidates the settings query, so the page re-reads the saved values itself.
  const save = async () => {
    try {
      await updateSettings.mutateAsync({ logoUrl, siteName, supportEmail });
      toast({ title: 'Branding saved', description: 'Invoices and emails will use these details.' });
    } catch (error) {
      toast({ title: 'Save failed', description: unitOfService.ErrorHandlerService.getErrorMessage(error as never), variant: 'destructive' });
    }
  };

  return (
    <div className="grid gap-4 sm:gap-5">
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2 lg:items-start">
        <SectionCard
          icon={<UploadCloud className="h-4 w-4" />}
          title="Logo"
          description={`Shown on invoices and atop every email. PNG, JPG, WEBP or SVG, up to ${MAX_LOGO_MB}MB.`}
        >
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload logo"
            onClick={() => !uploading && fileInputRef.current?.click()}
            onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && !uploading && fileInputRef.current?.click()}
            onDrop={(event: DragEvent<HTMLDivElement>) => {
              event.preventDefault();
              setIsDragging(false);
              handleFile(event.dataTransfer.files?.[0]);
            }}
            onDragOver={(event: DragEvent<HTMLDivElement>) => {
              event.preventDefault();
              if (!uploading) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            className={cn(
              'flex h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-muted/30 p-4 text-center transition',
              isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/60 hover:bg-muted/50',
              uploading && 'pointer-events-none opacity-70'
            )}
          >
            {uploading ? (
              <div className="w-full max-w-[220px]">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                <Progress value={progress} className="mt-3 h-1.5" />
                <p className="mt-2 text-xs text-muted-foreground">Uploading… {progress}%</p>
              </div>
            ) : logoUrl ? (
              // Blob URLs are not in next.config's remotePatterns, so a plain <img> is correct here.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Store logo" className="max-h-28 max-w-full object-contain" />
            ) : (
              <>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UploadCloud className="h-5 w-5" />
                </span>
                <p className="text-sm font-medium">Click to upload, or drag an image here</p>
                <p className="text-xs text-muted-foreground">Using the built-in logo until you upload one</p>
              </>
            )}
          </div>

          <input ref={fileInputRef} type="file" accept={ACCEPTED} className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={UploadCloud}
              iconPlacement="left"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {logoUrl ? 'Replace' : 'Upload'}
            </Button>
            {logoUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Trash2}
                iconPlacement="left"
                onClick={() => setLogoUrl('')}
                disabled={uploading}
              >
                Remove
              </Button>
            )}
            {logoUrl ? (
              <Badge variant="secondary" className="ml-auto">
                Custom logo
              </Badge>
            ) : (
              <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <ImageOff className="h-3.5 w-3.5" />
                No custom logo
              </span>
            )}
          </div>

          {logoUrl && (
            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Contrast check</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Emails sit on white; the Classic invoice masthead is navy. Both should read clearly.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="flex h-20 items-center justify-center rounded-lg border border-border/70 bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt="Logo on a light background" className="max-h-12 max-w-full object-contain" />
                </div>
                <div className="flex h-20 items-center justify-center rounded-lg border border-border/70 bg-[#092a55] p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt="Logo on a dark background" className="max-h-12 max-w-full object-contain" />
                </div>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard
          icon={<Building2 className="h-4 w-4" />}
          title="Business details"
          description="Used as the brand name and reply-to address in invoices and emails."
        >
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="setting-site-name" className="flex items-center gap-1.5 text-xs font-medium text-foreground/80">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                Site name
              </Label>
              <Input id="setting-site-name" value={siteName} onChange={(event) => setSiteName(event.target.value)} placeholder="Your store name" />
              <p className="text-xs text-muted-foreground">Replaces the app name wherever an email says {'{{PlatformName}}'}.</p>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="setting-support-email" className="flex items-center gap-1.5 text-xs font-medium text-foreground/80">
                <AtSign className="h-3.5 w-3.5 text-muted-foreground" />
                Support email
              </Label>
              <Input
                id="setting-support-email"
                type="email"
                value={supportEmail}
                onChange={(event) => setSupportEmail(event.target.value)}
                placeholder="support@example.com"
              />
              <p className="text-xs text-muted-foreground">Shown to customers in the welcome email as the address to reply to.</p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* One save bar for the whole tab, so the two cards cannot be saved out of step. */}
      <div
        className={cn(
          'sticky bottom-4 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 shadow-sm transition sm:px-5',
          dirty ? 'border-primary/40 bg-card' : 'border-border/70 bg-card/80'
        )}
      >
        <span className={cn('h-2 w-2 shrink-0 rounded-full', dirty ? 'bg-amber-500' : 'bg-emerald-500')} aria-hidden />
        <p className="text-sm text-muted-foreground">{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</p>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="outline" size="sm" icon={RotateCcw} iconPlacement="left" onClick={revert} disabled={!dirty || saving}>
            Revert
          </Button>
          <Button type="button" size="sm" icon={Save} iconPlacement="left" loading={saving} onClick={save} disabled={!dirty || saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
