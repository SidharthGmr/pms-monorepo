'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

import { FiEdit, FiTrash2, FiEye, FiPlus, FiHeadphones, FiVideo, FiFileText } from 'react-icons/fi';
import { IoIosSend } from 'react-icons/io';

type Variant = 'default' | 'add' | 'edit' | 'delete' | 'view' | 'send' | 'audio' | 'video' | 'document';

interface ActionTooltipProps {
  variant?: Variant;

  /** UI */
  icon?: React.ReactNode;
  text?: string;
  showText?: boolean;

  /** Behavior */
  onClick?: () => void;
  href?: string;

  /** State */
  disabled?: boolean;

  /** Tooltip */
  tooltip?: string;

  /** Styling */
  className?: string;
  size?: 'icon' | 'sm' | 'default';
}

/* ---------------------------------- */
/* Variant Config */
/* ---------------------------------- */

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
    styles: 'bg-muted text-muted-foreground hover:bg-muted/70',
  },
  add: {
    icon: FiPlus,
    label: 'Add',
    styles: 'bg-green-100 text-green-700 hover:bg-green-200',
  },
  edit: {
    icon: FiEdit,
    label: 'Edit',
    styles: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  },
  delete: {
    icon: FiTrash2,
    label: 'Delete',
    styles: 'bg-red-100 text-red-700 hover:bg-red-200',
  },
  view: {
    icon: FiEye,
    label: 'View',
    styles: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  },
  send: {
    icon: IoIosSend,
    label: 'Send',
    styles: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
  },
  audio: {
    icon: FiHeadphones,
    label: 'Audio',
    styles: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
  },
  video: {
    icon: FiVideo,
    label: 'Video',
    styles: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200',
  },
  document: {
    icon: FiFileText,
    label: 'Document',
    styles: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
  },
};

/* ---------------------------------- */
/* Component */
/* ---------------------------------- */

export default function ActionTooltip({
  variant = 'default',
  icon,
  text,
  showText = false,
  onClick,
  href,
  disabled,
  tooltip,
  className,
  size = 'icon',
}: ActionTooltipProps) {
  const config = VARIANT_CONFIG[variant];

  const Icon = config.icon;

  // Decide icon
  const isSmall = size === 'sm';
  const finalIcon = icon || (Icon ? <Icon className={cn(isSmall ? 'h-3.5 w-3.5' : 'h-4 w-4')} /> : null);

  // Tooltip fallback
  const finalTooltip = tooltip || text || config.label;

  // Decide content
  const content = (
    <Button
      type="button"
      size={size}
      disabled={disabled}
      onClick={!href ? onClick : undefined}
      className={cn('flex items-center transition-all', isSmall ? 'gap-1 px-2 h-8' : 'gap-2', config.styles, className)}
    >
      {finalIcon}
      {showText && (text || config.label)}
    </Button>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{href && !disabled ? <Link href={href}>{content}</Link> : content}</TooltipTrigger>

        {finalTooltip && <TooltipContent className="text-xs">{finalTooltip}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
}
