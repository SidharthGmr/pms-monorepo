'use client';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PurchaseDto } from '@/dtos/purchase.dto';
import { Row } from '@tanstack/react-table';
import { ExternalLink, Eye } from 'lucide-react';
import Link from 'next/link';

interface PurchaseListRowActionsProps<TData> {
  row: Row<TData>;
}

export default function PurchaseListRowActions<TData>({ row }: PurchaseListRowActionsProps<TData>) {
  const purchase = row.original as PurchaseDto;

  return (
    <TooltipProvider>
      <div className="flex items-center justify-end gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
              <Link href={`/admin/stock-purchase/history/${purchase.id}`} aria-label={`View purchase ${purchase.invoiceNumber || purchase.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">View details</p>
          </TooltipContent>
        </Tooltip>

        {purchase.invoiceUrl && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
                <a href={purchase.invoiceUrl} target="_blank" rel="noopener noreferrer" aria-label="Open invoice file">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Open invoice</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
