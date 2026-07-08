'use client';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from '@radix-ui/react-icons';
import { Calendar, CalendarProps } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TimePicker12HourFormat } from './time-picker-12hour-format';

/*
when enableTime is true. Then call like this in form
enableTime={true}
onTimeChange={(selectedDate) => {
  field.onChange(selectedDate);
}}
*/

type DateTimePickerProps = CalendarProps & {
  value?: Date;
  placeholder?: string;
  onDayClick?: (value: Date) => void;
  enableTime?: boolean;
  onTimeChange?: (value: Date) => void;
  align?: 'start' | 'center' | 'end';
  buttonClass?: string;
};

export default function DateTimePicker({
  value,
  placeholder,
  onDayClick,
  onMonthChange,
  enableTime,
  onTimeChange,
  align = 'start',
  buttonClass,
  ...props
}: DateTimePickerProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [month, setMonth] = React.useState<Date | undefined>(value);

  React.useEffect(() => {
    setMonth(value);
  }, [value]);

  useEffect(() => {
    if (enableTime && !onTimeChange) {
      throw new Error('onTimeChange function is required when displayTime is true.');
    }
  }, [enableTime, onTimeChange]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal', !value && 'text-muted-foreground', buttonClass)}>
          {value ? (
            enableTime ? (
              format(value, 'MMM d, yyyy hh:mm:ss a')
            ) : (
              format(value, 'MMM d, yyyy')
            )
          ) : (
            <span>{placeholder ? placeholder : 'Pick a date'}</span>
          )}
          <CalendarIcon className="ml-[10px] h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar
          captionLayout="dropdown-buttons"
          fromYear={1901}
          toYear={new Date().getFullYear() + 25}
          {...props}
          onDayClick={(selected) => {
            if (!enableTime) {
              setOpen(false);
            }
            setMonth(selected);
            if (onDayClick) {
              onDayClick(selected);
            }
          }}
          onMonthChange={(selected) => {
            setMonth(selected);
            if (onMonthChange) {
              onMonthChange(selected);
            }
          }}
          month={month}
        />
        {enableTime && value && (
          <div className="p-3 border-t border-border">
            <TimePicker12HourFormat
              date={month}
              setDate={(date) => {
                const newDate = new Date(month!);
                newDate.setHours(date ? date.getHours() : 12);
                newDate.setMinutes(date ? date.getMinutes() : 0);
                newDate.setSeconds(date ? date.getSeconds() : 0);
                if (onTimeChange) {
                  onTimeChange(newDate);
                }
              }}
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
