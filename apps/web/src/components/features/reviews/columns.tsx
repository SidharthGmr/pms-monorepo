'use client';
import StarRating from '@/components/common/star-rating';
import ActionTooltip from '@/components/common/tooltip-action-button';
import { Badge } from '@/components/ui/badge';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { ReviewDto } from '@/dtos/review.dto';
import { StatusValues } from '@/enums/status-values.enum';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ColumnDef } from '@tanstack/react-table';
import { MessageSquare, ShieldCheck } from 'lucide-react';
import { useMemo } from 'react';
import { DataTableColumnHeader } from '../../Table/data-table-column-header';

interface ReviewColumnOptions {
  replyRecord: (id: number) => void;
  moderateRecord: (id: number, status: StatusValues) => void;
  deleteRecord: (id: number) => void;
}

const statusVariant = (status: string) => {
  if (status === StatusValues.Published) return 'green';
  if (status === StatusValues.Draft) return 'orange';
  return 'rose';
};

export const useReviewColumns = ({ replyRecord, moderateRecord, deleteRecord }: ReviewColumnOptions) =>
  useMemo<ColumnDef<ReviewDto>[]>(
    () => [
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => {
          const status = row.original.status as string;
          return (
            <div className="flex items-center gap-2">
              <ActionTooltip variant="default" icon={<MessageSquare className="h-4 w-4" />} tooltip="Reply" onClick={() => replyRecord(row.original.id)} />
              {/* Publishing a Draft and un-publishing a live review are the two moves
                  moderation actually needs; Trash is the delete action below. */}
              {status !== StatusValues.Published && (
                <ActionTooltip
                  variant="add"
                  tooltip="Publish"
                  onClick={() => moderateRecord(row.original.id, StatusValues.Published)}
                />
              )}
              {status === StatusValues.Published && (
                <ActionTooltip variant="edit" tooltip="Move to Draft" onClick={() => moderateRecord(row.original.id, StatusValues.Draft)} />
              )}
              <ActionTooltip variant="delete" tooltip="Trash Review" onClick={() => deleteRecord(row.original.id)} />
            </div>
          );
        },
      },
      {
        id: 'product',
        accessorKey: 'productId',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Product" />,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.product?.name || `Product #${row.original.productId}`}</span>
            <span className="text-xs text-muted-foreground">Order #{row.original.orderId}</span>
          </div>
        ),
      },
      {
        id: 'reviewer',
        accessorKey: 'userId',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Reviewer" />,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.user?.name || '—'}</span>
            <span className="text-xs text-muted-foreground">{row.original.user?.email || row.original.userId}</span>
          </div>
        ),
      },
      {
        id: 'rating',
        accessorKey: 'rating',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Rating" />,
        cell: ({ row }) => <StarRating value={row.original.rating} size="sm" showValue />,
        meta: { sortingKey: 'rating' },
      },
      {
        id: 'review',
        accessorKey: 'title',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Review" />,
        cell: ({ row }) => (
          <div className="flex max-w-[320px] flex-col gap-0.5">
            {row.original.title && <span className="truncate font-medium">{row.original.title}</span>}
            {row.original.comment && <span className="line-clamp-2 text-xs text-muted-foreground">{row.original.comment}</span>}
            {!row.original.title && !row.original.comment && <span className="text-muted-foreground">Rating only</span>}
            {!!row.original.replies?.length && (
              <span className="text-xs font-medium text-primary">
                {row.original.replies.length} repl{row.original.replies.length === 1 ? 'y' : 'ies'}
              </span>
            )}
          </div>
        ),
      },
      {
        id: 'isVerified',
        accessorKey: 'isVerified',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Verified" />,
        cell: ({ row }) =>
          row.original.isVerified ? (
            <Badge variant="green" className="gap-1">
              <ShieldCheck className="h-3 w-3" /> Yes
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
        meta: { thClassName: 'text-center', tdClassName: 'text-center' },
      },
      {
        id: 'status',
        accessorKey: 'status',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Status" />,
        cell: ({ row }) => <Badge variant={statusVariant(row.original.status as string)}>{row.original.status}</Badge>,
        meta: { thClassName: 'text-center', tdClassName: 'text-center' },
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Submitted" />,
        cell: ({ row }) => {
          const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
          return (
            <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
              {row.original.createdAt
                ? unitOfService.DateTimeService.convertToLocalDate(row.original.createdAt as unknown as Date, true)
                : '—'}
            </span>
          );
        },
        meta: { sortingKey: 'createdAt' },
      },
    ],
    [replyRecord, moderateRecord, deleteRecord]
  );
