import DropdownBasicDto from '@/dtos/dropdown-basic.dto';
import { useEffect, useState } from 'react';

interface FilterHookProps<T> {
  inputData: T[];
  dataMapper: (item: T) => DropdownBasicDto;
  onChange?: (selectedValues: any) => void;
  initialValue?: string | number;
  initialValueType?: 'string' | 'number';
}

function useFilterHook<T>({ inputData, dataMapper, onChange, initialValue, initialValueType = 'string' }: FilterHookProps<T>) {
  const [data, setData] = useState<DropdownBasicDto[]>([]);
  const [selectedValue, setSelectedValue] = useState<string | number>(initialValue || '');
  const [isFiltered, setIsFiltered] = useState<boolean>(false);

  useEffect(() => {
    setData(inputData?.map(dataMapper) || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputData]);

  useEffect(() => {
    if (initialValueType == 'number') {
      setSelectedValue(initialValue || 0);
    } else {
      setSelectedValue(initialValue || '');
    }
  }, [initialValueType, initialValue]);

  const onValueChange = (selected: any) => {
    setIsFiltered(!!selected);
    setSelectedValue(selected);
    if (onChange) {
      onChange(selected);
    }
  };

  return { data, selectedValue, setSelectedValue, onValueChange, isFiltered, setIsFiltered };
}

export default useFilterHook;
