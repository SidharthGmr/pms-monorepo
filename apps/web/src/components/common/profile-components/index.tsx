import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import config from '@/config';
import { CardDescription, CardTitle } from '@/components/ui/card';

interface ProfileImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
}

export function ProfileImage({ src, alt = 'Profile picture', className = '' }: ProfileImageProps) {
  return (
    <div className="relative pt-10">
      <div className="absolute inset-0 h-32 bg-gradient-to-r from-emerald-900 to-emerald-700" />
      <div className={`flex justify-center relative ${className}`}>
        <div className="relative h-40 w-40 overflow-hidden rounded-2xl border-4 border-background bg-muted shadow-sm">
          <Image src={src || `${config.cdnUrl}/images/dummy-profile-thumbnail.webp`} alt={alt} fill className="object-cover" />
          <span className="absolute bottom-2 right-2 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
        </div>
      </div>
    </div>
  );
}

interface YesNoBadgeProps {
  value?: boolean;
  yesText?: string;
  noText?: string;
  className?: string;
}

export function YesNoBadge({ value, yesText = 'Yes', noText = 'No', className }: YesNoBadgeProps) {
  return (
    <Badge variant={value ? 'green' : 'destructive'} className={cn('rounded-full px-2.5', className)}>
      {value ? yesText : noText}
    </Badge>
  );
}

interface InfoRowProps {
  label: string;
  value?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

export function InfoRow({ label, value, className, labelClassName, valueClassName }: InfoRowProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-4 rounded-lg bg-muted/50 px-3 py-2', className)}>
      <span className={cn('text-xs font-medium text-muted-foreground', labelClassName)}>{label}</span>

      <span className={cn(' text-xs font-semibold text-foreground break-words max-w-[60%] text-right', valueClassName)}>{value || '-'}</span>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  iconClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
}

export function DetailRow({ label, value, icon, className, iconClassName, labelClassName, valueClassName }: DetailRowProps) {
  return (
    <div
      className={cn(
        'group flex items-start gap-2 rounded-lg border border-border/40 bg-card/50 p-2 shadow-sm transition-all hover:border-primary/30 hover:shadow-md',
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/5 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary',
            iconClassName
          )}
        >
          {icon}
        </div>
      )}

      <div className="min-w-0 flex-1 space-y-1">
        <CardDescription className={cn('mb-0 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80', labelClassName)}>
          {label}
        </CardDescription>

        <div className={cn('break-words text-sm font-medium text-foreground', valueClassName)}>{value || '-'}</div>
      </div>
    </div>
  );
}

interface SectionTitleProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  iconClassName?: string;
  titleClassName?: string;
}

export function SectionTitle({ children, icon, className, iconClassName, titleClassName }: SectionTitleProps) {
  return (
    <div className={cn('mb-4 flex items-center gap-3 rounded-lg bg-accent px-3 py-2', className)}>
      {icon && <div className={cn('text-primary ', iconClassName)}>{icon}</div>}

      <div className="flex-1">
        <CardTitle className={cn('text-sm font-bold uppercase mb-0', titleClassName)}>{children}</CardTitle>
      </div>

      {/* <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" /> */}
    </div>
  );
}
