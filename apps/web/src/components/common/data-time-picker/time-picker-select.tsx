import React from 'react';
import { Period, TimePickerType, getDateByType, setDateByType } from './time-picker-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface TimePickerInputProps {
  picker: TimePickerType;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  period?: Period;
  onRightFocus?: () => void;
  onLeftFocus?: () => void;
}

const TimePickerSelect = React.forwardRef<HTMLButtonElement, TimePickerInputProps>(
  ({ date = new Date(new Date().setHours(0, 0, 0, 0)), setDate, picker, period, onLeftFocus, onRightFocus }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'ArrowRight') onRightFocus?.();
      if (e.key === 'ArrowLeft') onLeftFocus?.();
    };

    const generateOptions = () => {
      const max = picker === '12hours' ? 12 : 59;
      const options = [];
      for (let i = 1; i <= max; i++) {
        let value: string = i < 10 ? `0${i}` : `${i}`;
        if (picker === 'minutes' || picker === 'seconds') {
          value = i < 10 ? `${i}` : `${i}`;
        }
        options.push(
          <SelectItem key={i} value={value}>
            {value}
          </SelectItem>
        );
      }
      return options;
    };

    const calculatedValue = React.useMemo(() => getDateByType(date, picker), [date, picker]);

    const handleValueChange = (e: string) => {
      const tempDate = new Date(date);
      const newValue = e;
      const newDate = setDateByType(tempDate, newValue, picker, period);
      console.log('newDate', newDate);

      setDate(newDate);
    };

    return (
      <>
        <Select defaultValue={calculatedValue} onValueChange={(value: string) => handleValueChange(value)}>
          <SelectTrigger ref={ref} className="w-[65px] focus:bg-accent focus:text-accent-foreground" onKeyDown={handleKeyDown}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>{generateOptions()}</SelectContent>
        </Select>
      </>
    );
  }
);

TimePickerSelect.displayName = 'TimePickerSelect';

export { TimePickerSelect };
