'use client';
import { UserDto } from '@/dtos/UserDto';
import { Row } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '../../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';

interface UserRowActionsProps {
  row: Row<UserDto>;
  editRecord?: (id: string) => void;
  deleteRecord?: (id: string) => void;
}

export function UserRowActions({ row, editRecord, deleteRecord }: UserRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {editRecord && (
          <DropdownMenuItem onClick={() => editRecord(row.original.usersId)}>
            Edit
          </DropdownMenuItem>
        )}
        {deleteRecord && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => deleteRecord(row.original.usersId)} className="text-destructive">
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu >
  );
}
