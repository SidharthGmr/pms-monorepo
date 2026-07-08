import * as React from 'react';

import { cn } from '@/lib/utils';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { size?: 'sm' | 'md' | 'lg'; hoverEffect?: boolean }>(
  ({ className, size, hoverEffect = false, ...props }, ref) => {
    const sizeClasses = size === 'sm' ? 'px-4 py-2 md:py-3' : size === 'md' || size === 'lg' ? 'p-4 md:p-6' : 'p-3 md:p-5'; // Default padding when size is not provided

    const hoverClasses = hoverEffect
      ? 'duration-300 ease-in-out transition-all hover:bg-primary  border before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(45deg,transparent_15%,rgba(255,255,255,0.5)_50%,transparent_75%,transparent_100%)] before:bg-[length:250%_250%,100%_100%] before:bg-[position:200%_0,0_0] before:bg-no-repeat before:transition-[background-position_0s_ease] hover:before:bg-[position:-100%_0,0_0] before:duration-500'
      : '';

    return (
      <div
        ref={ref}
        className={cn('relative rounded-lg bg-background text-foreground shadow-[0_3px_30px_rgba(0,0,0,0.01)]', sizeClasses, hoverClasses, className)}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-2 p-6', className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  variant?: 'sm' | 'md' | 'lg';
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(({ className, variant = 'md', ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      'text-xl font-medium leading-none tracking-tight text-foreground',
      {
        'text-md': variant === 'sm',
        'text-xl': variant === 'md',
        'text-2xl': variant === 'lg',
      },
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-[15px] text-muted-foreground pb-0', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
