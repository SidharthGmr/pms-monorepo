'use client';
import ActionTooltip from '@/components/common/tooltip-action-button';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { ProductDto } from '@/dtos/product.dto';
import { StatusValues } from '@/enums/status-values.enum';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { DataTableColumnHeader } from '../../Table/data-table-column-header';
import { Badge } from '../../ui/badge';
import ProductListRowActions from './row-action';
import { Image as ImageIcon } from 'lucide-react';

export const useProductColumns = (deleteRecord: (id: number) => void) =>
  useMemo<ColumnDef<ProductDto>[]>(
    () => [
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => <ProductListRowActions row={row} deleteRecord={deleteRecord} />,
      }, {
        id: 'name',
        accessorKey: 'name',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Product" />,
        cell: ({ row }) => {
          const imageUrl = row.original.images && row.original.images.length > 0 ? row.original.images[0] : null;
          return (
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 rounded border overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                {imageUrl ? (
                  <img src={imageUrl} alt={row.original.name} className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="font-medium block truncate max-w-[200px]" title={row.original.name}>{row.original.name}</span>
                <span className="text-xs text-muted-foreground block truncate max-w-[200px]" title={row.original.slug}>{row.original.slug}</span>
              </div>
            </div>
          );
        },
        meta: { sortingKey: 'name' },
      },

      {
        id: 'price',
        accessorKey: 'price',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Price / Cost" />,
        cell: ({ row }) => {
          const sellingPrice = row.original.currentPrice?.sellingPrice ?? row.original.price;
          const costPrice = row.original.currentPrice?.costPrice ?? row.original.cost;
          return (
            <div className="space-y-0.5">
              <span className="block font-medium">{sellingPrice != null ? `$${sellingPrice.toFixed(2)}` : '—'}</span>
              {costPrice != null && <span className="text-xs text-muted-foreground">Cost: ${costPrice.toFixed(2)}</span>}
            </div>
          );
        },
        meta: { sortingKey: 'price' },
      },
      {
        id: 'stock',
        accessorKey: 'stock',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Stock" />,
        cell: ({ row }) => {
          const { stock, lowStockThreshold } = row.original;
          const isLow = lowStockThreshold != null && stock <= lowStockThreshold;
          return (
            <div className="space-y-0.5">
              <span className={`block font-medium ${isLow ? 'text-destructive' : ''}`}>{stock}</span>
              {isLow && <span className="text-xs text-destructive">Low stock</span>}
            </div>
          );
        },
        meta: { sortingKey: 'stock' },
      },
      {
        id: 'actions-mobile',
        accessorKey: 'actions',
        enableHiding: false,
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <ActionTooltip variant="edit" tooltip="Edit Record" href={`/admin/products/${row.original.id}`} />
            <ActionTooltip variant="delete" tooltip="Delete Record" onClick={() => deleteRecord(+row.original.id)} />
          </div>
        ),
        meta: { sortingKey: 'actions' },
      }, {
        id: 'status',
        accessorKey: 'status',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Status" />,
        cell: ({ row }) => <Badge variant={row.original.status === StatusValues.Published ? 'scusses' : 'orange'}>{row.original.status}</Badge>,
        meta: { sortingKey: 'status' },
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Created At" />,
        cell: ({ row }) => {
          const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
          return (
            <span className="text-sm text-muted-foreground">
              {row.original.createdAt ? unitOfService.DateTimeService.convertToLocalDate(row.original.createdAt, true) : '-'}
            </span>
          );
        },
        meta: { sortingKey: 'createdAt' },
      },

    ],
    [deleteRecord]
  );
