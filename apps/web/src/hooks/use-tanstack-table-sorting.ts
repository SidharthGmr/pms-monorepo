import { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';

export function useTanstackTableSorting<T>(initialField: string = 'id', initialOrder: string = 'ASC', columns?: ColumnDef<T>[]) {
  const [sorting, setSorting] = useState([{ id: initialField, desc: initialOrder === 'DESC' }]);

  let sortingKey = sorting.length ? sorting[0].id : initialField;

  if (columns && sorting.length > 0) {
    const column = columns.find((e) => e.id == sorting[0].id);
    if (column && column.meta && (column.meta as any).sortingKey) {
      sortingKey = (column.meta as any).sortingKey;
    }
  }

  return {
    sorting,
    onSortingChange: setSorting,
    order: !sorting.length ? initialOrder : sorting[0].desc ? 'DESC' : 'ASC',
    field: sortingKey,
  };
}
