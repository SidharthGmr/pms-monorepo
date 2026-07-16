'use client';

import * as React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/components/ui/utils';
import { buttonVariants } from '@/components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-3',
        caption: 'flex justify-center items-center relative pt-1 pb-2',
        caption_label: 'text-sm font-semibold inline-flex items-center gap-1',
        caption_dropdowns: 'flex items-center gap-2',
        dropdown_month:
          'relative inline-flex items-center rounded-md border border-input bg-background px-2 py-1 hover:bg-accent hover:text-accent-foreground transition-colors',
        dropdown_year:
          'relative inline-flex items-center rounded-md border border-input bg-background px-2 py-1 hover:bg-accent hover:text-accent-foreground transition-colors',
        dropdown: 'absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none opacity-0',
        vhidden: 'sr-only',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(buttonVariants({ variant: 'outline' }), 'h-7 w-7 p-0 opacity-70 hover:opacity-100'),
        nav_button_previous: 'absolute left-1 top-1',
        nav_button_next: 'absolute right-1 top-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'text-muted-foreground rounded-md w-9 font-medium text-[0.75rem] uppercase tracking-wide',
        row: 'flex w-full mt-1.5',
        cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-start)]:rounded-l-md [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day: cn(buttonVariants({ variant: 'ghost' }), 'h-9 w-9 p-0 font-normal aria-selected:opacity-100'),
        day_range_start: 'day-range-start',
        day_range_end: 'day-range-end',
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        day_today: 'bg-accent text-accent-foreground font-semibold',
        day_outside:
          'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
        day_disabled: 'text-muted-foreground opacity-40',
        day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
        IconDropdown: () => <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-60" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
