'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/components/ui/utils';

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { color?: string }
>(({ className, value, color = 'bg-secondary', ...props }, ref) => (
  <ProgressPrimitive.Root ref={ref} className={cn(`relative h-4 bg-secondary w-full overflow-hidden rounded-sm`, className)} {...props}>
    <ProgressPrimitive.Indicator
      className={`h-full w-full flex-1   ${color}   transition-all`}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
