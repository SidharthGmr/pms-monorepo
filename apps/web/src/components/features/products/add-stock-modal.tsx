'use client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IProductService from '@/services/interfaces/IProductService';
import { PackagePlus, Boxes, Tag, Wallet, TrendingUp } from 'lucide-react';

interface AddStockModalProps {
  productId: number;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddStockModal({ productId, productName, isOpen, onClose, onSuccess }: AddStockModalProps) {
  const [quantity, setQuantity] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Live profit margin preview when both prices are entered.
  const margin =
    sellingPrice !== '' && costPrice !== '' && Number(sellingPrice) > 0
      ? ((Number(sellingPrice) - Number(costPrice)) / Number(sellingPrice)) * 100
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || quantity <= 0) {
      toast({ title: 'Error', description: 'Quantity must be a positive integer', variant: 'destructive' });
      return;
    }
    if (sellingPrice !== '' && sellingPrice < 0) {
      toast({ title: 'Error', description: 'Selling price must be zero or greater', variant: 'destructive' });
      return;
    }
    if (costPrice !== '' && costPrice < 0) {
      toast({ title: 'Error', description: 'Cost price must be zero or greater', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const productService = container.get<IProductService>(TYPES.IProductService);
      await productService.addStock(productId, {
        quantity: Number(quantity),
        reason: reason || undefined,
        ...(sellingPrice !== '' && { sellingPrice: Number(sellingPrice) }),
        ...(costPrice !== '' && { costPrice: Number(costPrice) }),
      });
      toast({ title: 'Success', description: 'Stock added successfully' });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({ title: 'Error', description: error?.response?.data?.message || 'Failed to add stock', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        {/* Header */}
        <DialogHeader className="space-y-0 px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <PackagePlus className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base">Add Stock</DialogTitle>
              <DialogDescription className="truncate">{productName}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">
            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity" className="flex items-center gap-1.5 text-slate-700">
                <Boxes className="w-3.5 h-3.5 text-slate-400" />
                Quantity to add
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value ? parseInt(e.target.value) : '')}
                placeholder="0"
                className="h-11 text-lg font-semibold"
                autoFocus
                required
              />
            </div>

            {/* Pricing */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Pricing
                </span>
                {margin !== null && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      margin >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    <TrendingUp className="w-3 h-3" />
                    {margin.toFixed(1)}% margin
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sellingPrice" className="text-xs text-slate-500 font-normal">
                    Selling price
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">$</span>
                    <Input
                      id="sellingPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value ? parseFloat(e.target.value) : '')}
                      placeholder="0.00"
                      className="pl-6"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="costPrice" className="flex items-center gap-1 text-xs text-slate-500 font-normal">
                    <Wallet className="w-3 h-3" />
                    Cost price
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">$</span>
                    <Input
                      id="costPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value ? parseFloat(e.target.value) : '')}
                      placeholder="0.00"
                      className="pl-6"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400">Leave blank to keep the current price unchanged.</p>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-slate-700">
                Reason <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Restock from supplier, Returned item"
                rows={2}
                className="resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} icon={PackagePlus} iconPlacement="left">
              {loading ? 'Saving...' : 'Add Stock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
