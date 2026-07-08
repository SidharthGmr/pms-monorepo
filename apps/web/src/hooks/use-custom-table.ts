import React from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { TableOptions } from '@tanstack/react-table';
import { getFilteredRowModel } from '@tanstack/react-table';
import config from '@/config';

interface CustomDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  manualFiltering?: boolean;
  manualPagination?: boolean;
  manualSorting?: boolean;
  pageCount?: number;
  pagination?: {
    pageSize: number;
    pageIndex: number;
  };
  sorting?: {
    id: string;
    desc: boolean;
  }[];
  onPaginationChange?: React.Dispatch<
    React.SetStateAction<{
      pageSize: number;
      pageIndex: number;
    }>
  >;
  onSortingChange?: React.Dispatch<
    React.SetStateAction<
      {
        id: string;
        desc: boolean;
      }[]
    >
  >;
}

export function useCustomDataTable<TData, TValue>({
  columns,
  data,
  manualFiltering,
  manualPagination,
  manualSorting,
  pageCount,
  pagination = {
    pageSize: config.recordPerPage,
    pageIndex: 0,
  },
  sorting,
  onPaginationChange,
  onSortingChange,
}: CustomDataTableProps<TData, TValue>) {
  const tableOptions: TableOptions<TData> = {
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  };

  if (manualPagination) {
    tableOptions.manualFiltering = manualFiltering;
    tableOptions.manualPagination = manualPagination;
    tableOptions.manualSorting = manualSorting;
    tableOptions.pageCount = pageCount;
    tableOptions.state = { pagination, sorting };

    if (onPaginationChange) {
      tableOptions.onPaginationChange = onPaginationChange;
    }

    if (onSortingChange) {
      tableOptions.onSortingChange = (option) => {
        onSortingChange(option);
      };
    }
  } else {
    if (pagination) {
      tableOptions.initialState = { ...tableOptions.initialState, pagination };
    }
  }

  const table = useReactTable(tableOptions);

  return table;
}
