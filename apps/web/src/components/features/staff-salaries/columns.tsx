'use client';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '../../Table/data-table-column-header';
import { useMemo } from 'react';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { StaffSalaryDto } from '@/dtos/staff-salary.dto';
import { Badge } from '../../ui/badge';
import ActionTooltip from '@/components/common/tooltip-action-button';
import { PaymentStatus } from '@/enums/payment-status.enum';
import StaffSalaryListRowActions from './row-action';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const useStaffSalaryColumns = (editRecord: (id: number) => void, deleteRecord: (id: number) => void) =>
  useMemo<ColumnDef<StaffSalaryDto>[]>(
    () => [
      {
        id: 'actions-mobile',
        accessorKey: 'actions',
        enableHiding: false,
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Action" />,
        cell: ({ row }) => {
          return (
            <>
              <div className="flex items-center gap-2">
                <ActionTooltip
                  variant="edit"
                  tooltip="Edit Record"
                  onClick={() => {
                    editRecord(+row.original.id);
                  }}
                />

                <ActionTooltip
                  variant="delete"
                  tooltip="Delete Record"
                  onClick={() => {
                    deleteRecord(+row.original.id);
                  }}
                />
              </div>
            </>
          );
        },
        meta: {
          sortingKey: 'actions',
        },
      },

      {
        id: 'staffId',
        accessorKey: 'staffId',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Staff ID" />,
        cell: ({ row }) => <span className="font-medium">#{row.original.staffId}</span>,
        meta: { sortingKey: 'staffId' },
      },
      {
        id: 'period',
        accessorKey: 'month',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Period" />,
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="block font-medium">
              {monthNames[row.original.month - 1]} {row.original.year}
            </span>
          </div>
        ),
        meta: { sortingKey: 'month' },
      },
      {
        id: 'baseSalary',
        accessorKey: 'baseSalary',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Base Salary" />,
        cell: ({ row }) => <span className="font-medium">${row.original.baseSalary.toFixed(2)}</span>,
        meta: { sortingKey: 'baseSalary' },
      },
      {
        id: 'adjustments',
        accessorKey: 'attendanceBonus',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Adjustments" />,
        cell: ({ row }) => {
          const bonus = row.original.attendanceBonus || 0;
          const deductions = (row.original.deductions || 0) + (row.original.advanceDeduction || 0);
          return (
            <div className="space-y-0.5">
              {bonus > 0 && <span className="block text-xs text-green-600">+${bonus.toFixed(2)} bonus</span>}
              {deductions > 0 && <span className="block text-xs text-red-600">-${deductions.toFixed(2)} deductions</span>}
            </div>
          );
        },
        meta: { sortingKey: 'adjustments' },
      },
      {
        id: 'netPayable',
        accessorKey: 'netPayable',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Net Payable" />,
        cell: ({ row }) => <span className="font-semibold text-primary">${row.original.netPayable.toFixed(2)}</span>,
        meta: { sortingKey: 'netPayable' },
      },
      {
        id: 'paidAmount',
        accessorKey: 'paidAmount',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Paid" />,
        cell: ({ row }) => <span className="font-medium">${row.original.paidAmount.toFixed(2)}</span>,
        meta: { sortingKey: 'paidAmount' },
      },
      {
        id: 'status',
        accessorKey: 'status',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Status" />,
        cell: ({ row }) => {
          const status = row.original.status;
          let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';

          if (status === PaymentStatus.Paid) variant = 'default';
          else if (status === PaymentStatus.Pending) variant = 'secondary';
          else if (status === PaymentStatus.PartiallyPaid) variant = 'outline';
          else if (status === PaymentStatus.Overdue) variant = 'destructive';

          return <Badge variant={variant}>{status}</Badge>;
        },
        meta: { sortingKey: 'status' },
      },
      {
        id: 'paymentDate',
        accessorKey: 'paymentDate',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Payment Date" />,
        cell: ({ row }) => {
          const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
          return (
            <span className="text-sm text-muted-foreground">
              {row.original.paymentDate ? unitOfService.DateTimeService.convertToLocalDate(row.original.paymentDate, true) : '-'}
            </span>
          );
        },
        meta: { sortingKey: 'paymentDate' },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => <StaffSalaryListRowActions row={row} editRecord={editRecord} deleteRecord={deleteRecord} />,
      },
    ],
    [editRecord, deleteRecord]
  );
