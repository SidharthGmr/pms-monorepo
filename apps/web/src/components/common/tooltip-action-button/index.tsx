'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

import { FiEdit, FiTrash2, FiEye, FiPlus, FiHeadphones, FiVideo, FiFileText, FiClock } from 'react-icons/fi';
import { IoIosSend } from 'react-icons/io';

type Variant = 'default' | 'add' | 'edit' | 'delete' | 'view' | 'send' | 'audio' | 'video' | 'document' | 'history';

interface ActionTooltipProps {
  variant?: Variant;
  icon?: React.ReactNode;
  text?: string;
  showText?: boolean;
  onClick?: () => void;
  href?: string;
  /** Where the link opens; only used with href. */
  target?: '_blank' | '_self';
  disabled?: boolean;
  tooltip?: string;
  ariaLabel?: string;
  className?: string;
  size?: 'icon' | 'sm' | 'default';
}

const VARIANT_CONFIG: Record<
  Variant,
  {
    icon: React.ElementType | null;
    label: string;
    styles: string;
  }
> = {
  default: {
    icon: null,
    label: '',
    styles: 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700',
  },
  add: {
    icon: FiPlus,
    label: 'Add',
    styles: 'bg-transparent text-slate-500 hover:bg-green-100 hover:text-green-700',
  },
  edit: {
    icon: FiEdit,
    label: 'Edit',
    styles: 'bg-transparent text-slate-500 hover:bg-blue-100 hover:text-blue-600',
  },
  delete: {
    icon: FiTrash2,
    label: 'Delete',
    styles: 'bg-transparent text-slate-500 hover:bg-red-100 hover:text-red-600',
  },
  view: {
    icon: FiEye,
    label: 'View',
    styles: 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700',
  },
  send: {
    icon: IoIosSend,
    label: 'Send',
    styles: 'bg-transparent text-slate-500 hover:bg-purple-100 hover:text-purple-700',
  },
  audio: {
    icon: FiHeadphones,
    label: 'Audio',
    styles: 'bg-transparent text-slate-500 hover:bg-orange-100 hover:text-orange-700',
  },
  video: {
    icon: FiVideo,
    label: 'Video',
    styles: 'bg-transparent text-slate-500 hover:bg-cyan-100 hover:text-cyan-700',
  },
  document: {
    icon: FiFileText,
    label: 'Document',
    styles: 'bg-transparent text-slate-500 hover:bg-indigo-100 hover:text-indigo-700',
  },
  history: {
    icon: FiClock,
    label: 'History',
    styles: 'bg-transparent text-slate-500 hover:bg-amber-100 hover:text-amber-700',
  },
};

export default function ActionTooltip({
  variant = 'default',
  icon,
  text,
  showText = false,
  onClick,
  href,
  target,
  disabled,
  tooltip,
  ariaLabel,
  className,
  size = 'icon',
}: ActionTooltipProps) {
  const config = VARIANT_CONFIG[variant];

  const Icon = config.icon;

  // Decide icon
  const isSmall = size === 'sm';
  const finalIcon = icon || (Icon ? <Icon className={cn(isSmall ? 'h-2 w-2' : 'h-3 w-3')} /> : null);

  // Tooltip fallback
  const finalTooltip = tooltip || text || config.label;

  // Decide content
  const content = (
    <Button
      type="button"
      size={size}
      variant="ghost"
      disabled={disabled}
      aria-label={ariaLabel ?? finalTooltip}
      onClick={!href ? onClick : undefined}
      className={cn(
        'flex items-center transition-all',
        isSmall ? 'gap-1 px-2 h-8 w-8 text-muted-foreground' : 'h-8 w-8 gap-2',
        config.styles,
        className
      )}
    >
      {finalIcon}
      {showText && (text || config.label)}
    </Button>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {href && !disabled ? (
            <Link href={href} target={target} rel={target === '_blank' ? 'noreferrer' : undefined}>
              {content}
            </Link>
          ) : (
            content
          )}
        </TooltipTrigger>
        {finalTooltip && <TooltipContent className="text-xs">{finalTooltip}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
}
