'use client';

import * as React from 'react';
import { CalendarIcon } from '@radix-ui/react-icons';
import { endOfMonth, format, startOfMonth, startOfToday, subDays, subMonths } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar, CalendarProps } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

//usage example
//const [dateRange, setDateRange] = useState<DateRange | undefined>();
//<DateRangePicker mode="range" value={dateRange} selected={dateRange} onSelect={setDateRange} />

type DateRangePickerProps = CalendarProps & {
  value?: DateRange;
  placeholder?: string;
  onSelect?: (value: DateRange | undefined) => void;
  align?: 'start' | 'center' | 'end';
  numberOfMonthsToShow?: number;
  buttonClass?: string;
};

export function DateRangePicker({
  className,
  value,
  placeholder,
  onSelect,
  align = 'start',
  numberOfMonthsToShow = 1,
  buttonClass,
  ...props
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(value);

  const [isOpen, setIsOpen] = React.useState(false);
  const [activePreset, setActivePreset] = React.useState<string | null>(null);

  const dateRanges = React.useMemo(
    () => [
      { label: 'Today', range: { from: startOfToday(), to: startOfToday() } },
      { label: 'Last 7 Days', range: { from: subDays(startOfToday(), 7), to: subDays(startOfToday(), 1) } },
      { label: 'Last 30 Days', range: { from: subDays(startOfToday(), 30), to: subDays(startOfToday(), 1) } },
      { label: 'This Month', range: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) } },
      { label: 'Last Month', range: { from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) } },
      { label: 'Custom Range', range: { from: startOfToday(), to: startOfToday() } },
    ],
    []
  );

  const handleDayClick = (range: DateRange | undefined) => {
    setDate(range);
    if (onSelect) {
      onSelect(range);
    }

    // setDate((prev) => {
    //   if (prev?.to) {
    //     // If 'to' is already set, reset the range
    //     return { from: day, to: undefined };
    //   } else if (prev?.from) {
    //     // If 'from' is set and 'to' is not
    //     if (day < prev.from) {
    //       // If the new day is before the 'from' date, reset the range
    //       return { from: day, to: undefined };
    //     } else {
    //       // Otherwise, set the 'to' date
    //       return { from: prev.from, to: day };
    //     }
    //   } else {
    //     // If neither 'from' nor 'to' is set, set 'from'
    //     return { from: day, to: undefined };
    //   }
    // });
  };

  React.useEffect(() => {
    setDate(value);
  }, [value]);

  return (
    <div className={cn('grid gap-1', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button id="date" variant={'outline'} className={cn('justify-start text-left font-normal !px-3', !date && 'text-muted-foreground', buttonClass)}>
            <CalendarIcon className="h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
                </>
              ) : (
                format(date.from, 'LLL dd, y')
              )
            ) : (
              <span>{placeholder ? placeholder : 'Pick a date'}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align={align}>
          <div className="flex">
            <div className="hidden md:flex flex-col gap-1 pr-4 text-left border-r border-foreground/10">
              {dateRanges.map(({ label, range }) => (
                <Button
                  key={label}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'justify-start hover:bg-primary/90 hover:text-primary-foreground p-2',
                    activePreset === label && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                  )}
                  onClick={() => {
                    setDate(range);
                    handleDayClick(range);
                    setActivePreset(label);
                    if (label === 'Custom Range') {
                      setIsOpen(true);
                    } else {
                      setIsOpen(false);
                    }
                  }}
                >
                  {label}
                </Button>
              ))}

              {date?.from && (
                <Button
                  variant="link"
                  size="sm"
                  className="text-center mt-2"
                  onClick={() => {
                    setDate(undefined); // Clear the date selection
                    setActivePreset(null); // Reset the active preset button
                  }}
                >
                  Clear Selection
                </Button>
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex">
                <Calendar
                  captionLayout="dropdown-buttons"
                  fromYear={1901}
                  toYear={new Date().getFullYear() + 50}
                  defaultMonth={date?.from}
                  {...props}
                  onSelect={handleDayClick}
                  numberOfMonths={numberOfMonthsToShow}
                  selected={date}
                  mode={'range'}
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
