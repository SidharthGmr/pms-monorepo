'use client';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import type { IconType } from 'react-icons';
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa';

export interface PageHeaderProps {
  title: string;
  description?: string;
  variant?: 'add' | 'back';
  actionText?: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ElementType | IconType;
  buttonVariant?: string;
}

export function PageHeader({ title, description, variant = 'add', actionText, href, onClick, icon, buttonVariant = 'outline' }: PageHeaderProps) {
  const router = useRouter();
  const [canShowAction, setCanShowAction] = useState(true);

  const isBack = variant === 'back';
  const finalActionText = actionText ?? (isBack ? 'Back' : 'Add');
  const finalIcon = icon ?? (isBack ? FaAngleLeft : FaAngleRight);
  const iconPlacement = isBack ? 'left' : 'right';
  const finalHref = isBack ? undefined : href;
  const finalOnClick = isBack ? () => router.back() : onClick;

  useEffect(() => {
    if (isBack) {
      setCanShowAction(window.history.length > 1);
    }
  }, [isBack]);

  return (
    <Card size="sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-2">
        <CardHeader className="p-0">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>

        {canShowAction && (finalHref || finalOnClick || isBack) && (
          <div className="w-full sm:w-auto flex items-center gap-2">
            {finalHref ? (
              <Button
                asChild
                icon={finalIcon as React.ElementType}
                iconPlacement={iconPlacement}
                variant={buttonVariant as any}
                className="w-full sm:w-auto"
              >
                <Link href={finalHref}>{finalActionText}</Link>
              </Button>
            ) : (
              <Button
                onClick={finalOnClick}
                icon={finalIcon as React.ElementType}
                iconPlacement={iconPlacement}
                variant={buttonVariant as any}
                className="w-full sm:w-auto"
              >
                {finalActionText}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
