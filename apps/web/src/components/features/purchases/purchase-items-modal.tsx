'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { PurchaseDto } from '@/dtos/purchase.dto';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ExternalLink } from 'lucide-react';
import { formatPurchaseAmount, purchaseStatusVariant } from './format';

interface PurchaseItemsModalProps {
  purchase: PurchaseDto;
  isOpen: boolean;
  onClose: () => void;
}

const SummaryField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
    <div className="text-sm break-words">{children}</div>
  </div>
);

export default function PurchaseItemsModal({ purchase, isOpen, onClose }: PurchaseItemsModalProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const items = purchase.items ?? [];
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  const itemsTotal = items.reduce((sum, item) => sum + (item.totalPrice ?? 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <span>Purchase #{purchase.id}</span>
            <Badge variant={purchaseStatusVariant(purchase.status)}>{purchase.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <SummaryField label="Invoice #">{purchase.invoiceNumber || '—'}</SummaryField>
          <SummaryField label="Supplier">{purchase.supplierName || '—'}</SummaryField>
          <SummaryField label="Supplier ID">{purchase.supplierId || '—'}</SummaryField>
          <SummaryField label="Purchase Date">
            {purchase.purchaseDate ? unitOfService.DateTimeService.convertToLocalDate(purchase.purchaseDate as unknown as Date, true) : '—'}
          </SummaryField>
          <SummaryField label="Created At">
            {purchase.createdAt ? unitOfService.DateTimeService.convertToLocalDate(purchase.createdAt as unknown as Date, true) : '—'}
          </SummaryField>
          <SummaryField label="Updated At">
            {purchase.updatedAt ? unitOfService.DateTimeService.convertToLocalDate(purchase.updatedAt as unknown as Date, true) : '—'}
          </SummaryField>
          <SummaryField label="Created By">
            {purchase.user ? (
              <div className="flex flex-col">
                <span>{purchase.user.name}</span>
                <span className="text-xs text-muted-foreground">{purchase.user.email}</span>
              </div>
            ) : (
              'System'
            )}
          </SummaryField>
          <SummaryField label="Total Amount">
            <span className="font-semibold text-primary">{formatPurchaseAmount(purchase.totalAmount)}</span>
          </SummaryField>
          <SummaryField label="Invoice File">
            {purchase.invoiceUrl ? (
              <a
                href={purchase.invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View
              </a>
            ) : (
              '—'
            )}
          </SummaryField>
          {purchase.notes && (
            <div className="col-span-2 md:col-span-3">
              <SummaryField label="Notes">{purchase.notes}</SummaryField>
            </div>
          )}
        </div>

        <Separator className="my-2" />

        <div>
          <p className="mb-2 text-sm font-semibold">
            Purchased Items <span className="text-muted-foreground">({items.length})</span>
          </p>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-semibold uppercase">Product</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">Slug</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase">Qty</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase">Cost Price</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No items recorded for this purchase.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{item.product?.name || `Product #${item.productId}`}</span>
                          <span className="text-xs text-muted-foreground">ID: {item.productId}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.product?.slug || '—'}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatPurchaseAmount(item.costPrice)}</TableCell>
                      <TableCell className="text-right font-medium">{formatPurchaseAmount(item.totalPrice)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {items.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="font-semibold">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-semibold">{totalQuantity}</TableCell>
                    <TableCell />
                    <TableCell className="text-right font-semibold text-primary">{formatPurchaseAmount(itemsTotal)}</TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
