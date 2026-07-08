import { useState } from 'react';

export function useTanstackTablePagination(initialSize: number = 10, initialIndex: number = 0) {
  const [pagination, setPagination] = useState({
    pageSize: initialSize,
    pageIndex: initialIndex,
  });

  return {
    onPaginationChange: setPagination,
    pagination,
  };
}
