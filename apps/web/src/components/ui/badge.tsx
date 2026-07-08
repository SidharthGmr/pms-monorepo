import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/components/ui/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-accent text-foreground hover:bg-accent/80',
        scusses: 'bg-green-50 text-green border-green',
        true: 'bg-primary/10 text-primary border-primary',
        false: 'border-transparent border-destructive bg-destructive/10 text-destructive',
        secondary: 'border-transparent bg-secondary text-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        white: 'bg-background text-foreground border-green-600',
        green: 'bg-green-50 text-green-600 border-green-600',
        rose: 'bg-rose-50 text-rose-600 border-rose-600 ',
        orange: 'bg-orange-50 text-orange-600 border-orange-600 ',
        blue: 'bg-sky-50 text-sky-600 border-sky-600',
        cyan: 'bg-cyan-50 text-cyan-600  border-cyan-600',
        indigo: 'bg-indigo-50 text-indigo-600  border-indigo-600',
        fuchsia: 'bg-fuchsia-50 text-fuchsia-600  border-fuchsia-600',
        purple: 'bg-purple-50 text-purple-600  border-purple-600',
        zinc: 'bg-zinc-50 text-zinc-600  border-zinc-600',
        neutral: 'bg-neutral-50 text-neutral-600  border-neutral-600',
        stone: 'bg-stone-50 text-stone-600 border-stone-600 ',
        violet: 'bg-violet-50 text-violet-600 border-violet-600 ',
        sky: 'bg-sky-50 text-sky-600  border-sky-600',
        teal: 'bg-teal-50 text-teal-600  border-teal-600',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-600 ',
        yellow: 'bg-yellow-50 text-yellow-600 border-yellow-600 ',
        lime: 'bg-lime-50 text-lime-600 border-lime-600 ',
        amber: 'bg-amber-50 text-amber-600  border-amber-600',
        facebook: 'bg-[#3b5998]/10 text-[#3b5998] border-[#3b5998]',
        twitter: 'bg-[#000000]/10 text-[#000000] border-[#000000]',
        instagram: 'bg-[#c32aa3]/10 text-[#c32aa3] border-[#c32aa3]',
        linkedIn: 'bg-[#0a66c2]/10 text-[#0a66c2] border-[#0a66c2]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> { }

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };

