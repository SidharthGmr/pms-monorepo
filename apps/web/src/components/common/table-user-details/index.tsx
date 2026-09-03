'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getAvatarSoftColor, getInitialName } from '@/utils/avatar-color';
import Link from 'next/link';
import React from 'react';

interface UserTableDetailProps {
  name?: string;
  email?: string;
  userId?: string;
  image?: string | null;
  hideTooltip?: boolean;
  metaText?: string;
  hideImage?: boolean;
}

export default function UserTableDetail({ name, email, userId, image, hideImage, hideTooltip = false, metaText }: UserTableDetailProps) {
  return (
    <div className="flex items-center space-x-3 min-w-0">
      {!hideImage && (
        <Avatar className="w-9 h-9 shrink-0">
          {image && <AvatarImage src={image} alt={name} className="object-cover" />}
          <AvatarFallback className={cn('uppercase font-bold text-[13px]', getAvatarSoftColor(name).bg, getAvatarSoftColor(name).text)}>
            {getInitialName(name)}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="space-y-1 min-w-0 flex-1">
        {!hideTooltip && userId ? (
          <Tooltip>
            <TooltipTrigger className="min-w-0 block w-full">
              <Link href={`/admin/users/${userId}`} className="block w-full min-w-0 text-foreground hover:text-primary text-start">
                <span className="block text-sm font-semibold capitalize truncate">{name} </span>
                <div className="flex flex-wrap gap-1 min-w-0">
                  <span className="block text-muted-foreground text-xs truncate">{email}</span>
                  {metaText && <span className="block text-muted-foreground text-xs truncate">{`${metaText}`}</span>}
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <span className="block  text-xs">Student Profile</span>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="text-start min-w-0">
            <span className="block font-semibold capitalize truncate">{name}</span>
            <span className="block text-muted-foreground text-xs truncate">
              {email}
              {metaText ? ` · ${metaText}` : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
