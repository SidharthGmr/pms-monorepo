'use client';

import * as React from 'react';
import { TimePicker12HourFormat } from './time-picker-12hour-format';

export function TimePicker12HourWrapper() {
  const [date, setDate] = React.useState<Date>();
  return <TimePicker12HourFormat setDate={setDate} date={date} />;
}
