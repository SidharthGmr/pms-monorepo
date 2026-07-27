'use client';
import { ProductVariantDto } from '@/dtos/product-variant.dto';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { useMemo } from 'react';
import { DataTableColumnHeader } from '../../Table/data-table-column-header';
import { Badge } from '../../ui/badge';

export const useProductVariantColumns = () =>
  useMemo<ColumnDef<ProductVariantDto>[]>(
    () => [
      {
        id: 'effectiveFrom',
        accessorKey: 'effectiveFrom',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Effective From" />
        ),
        cell: ({ row }) => (
          <div>{row.original.effectiveFrom ? format(new Date(row.original.effectiveFrom), 'PPpp') : '-'}</div>
        ),
        meta: { sortingKey: 'effectiveFrom' },
      },
      {
        id: 'sellingPrice',
        accessorKey: 'sellingPrice',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Selling Price" />
        ),
        cell: ({ row }) => {
          const value = row.original.sellingPrice;
          return <div className="font-medium">{value != null ? `$${Number(value).toFixed(2)}` : '—'}</div>;
        },
        meta: { sortingKey: 'sellingPrice' },
      },
      {
        id: 'costPrice',
        accessorKey: 'costPrice',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Cost Price" />
        ),
        cell: ({ row }) => {
          const value = row.original.costPrice;
          return <div className="text-muted-foreground">{value != null ? `$${Number(value).toFixed(2)}` : '—'}</div>;
        },
        meta: { sortingKey: 'costPrice' },
      },
      {
        id: 'margin',
        accessorKey: 'margin',
        enableSorting: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Margin" />
        ),
        cell: ({ row }) => {
          const { sellingPrice, costPrice } = row.original;
          if (sellingPrice == null || costPrice == null || Number(sellingPrice) === 0) return <div>—</div>;
          const margin = ((Number(sellingPrice) - Number(costPrice)) / Number(sellingPrice)) * 100;
          return <div className={margin < 0 ? 'text-destructive' : 'text-green-600'}>{margin.toFixed(1)}%</div>;
        },
        meta: { sortingKey: 'margin' },
      },
      {
        id: 'isActive',
        accessorKey: 'isActive',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Status" />
        ),
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'scusses' : 'orange'}>{row.original.isActive ? 'Active' : 'Superseded'}</Badge>
        ),
        meta: { sortingKey: 'isActive' },
      },
      {
        id: 'reason',
        accessorKey: 'reason',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Reason" />
        ),
        cell: ({ row }) => <div>{row.original.reason || '-'}</div>,
        meta: { sortingKey: 'reason' },
      },
    ],
    []
  );
