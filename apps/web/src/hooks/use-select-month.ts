'use client';
import { getSelectMonthOptions, getSelectYearOptions } from '@/lib/utils';
import { useState } from 'react';

export function useMonthYearSelect() {
  const monthOptions = getSelectMonthOptions();
  const yearOptions = getSelectYearOptions(11); // current year + 10 previous

  // Default to current month/year
  const now = new Date();
  const defaultMonth = now.getMonth() + 1;
  const defaultYear = now.getFullYear();

  const [activeMonth, setActiveMonth] = useState<string>(monthOptions.find((m) => Number(m.value) === defaultMonth)?.value || monthOptions[0].value);
  const [activeYear, setActiveYear] = useState<string>(yearOptions.find((y) => Number(y.value) === defaultYear)?.value || yearOptions[0].value);

  return {
    monthOptions,
    yearOptions,
    activeMonth,
    setActiveMonth,
    activeYear,
    setActiveYear,
  };
}
