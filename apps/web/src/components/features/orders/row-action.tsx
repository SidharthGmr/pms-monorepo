'use client';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { OrderDto } from '@/dtos/order.dto';
import { formatPrice } from '@/lib/format-price';
import { Eye, MessageCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface OrderRowActionsProps {
  order: OrderDto;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

// View and Edit sit inline; sharing and the destructive delete live behind the "…" menu.
export function OrderRowActions({ order, onView, onEdit, onDelete }: OrderRowActionsProps) {
  const sendWhatsAppMessage = () => {
    const lines = (order.items ?? []).map((item) => `- ${item.product?.name ?? `Product #${item.productId}`} x${item.quantity ?? 1} — ${formatPrice(item.unitPrice ?? 0)}`);
    const message = [
      `Order ${order.orderNumber}`,
      order.createdAt ? `Placed: ${new Date(order.createdAt).toLocaleDateString()}` : '',
      `Total: ${formatPrice(order.grandTotal ?? 0)}`,
      '',
      lines.length ? 'Items:' : 'No items',
      ...lines,
    ]
      .filter(Boolean)
      .join('\n');

    // Without a number WhatsApp opens the contact picker, which is what we want: the previous
    // hardcoded 1234567890 silently messaged a stranger.
    const phone = (order.customer?.phone ?? '').replace(/[^\d]/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  };

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="View">
        <Link href={`/admin/orders/${order.id}`} aria-label={`View order ${order.orderNumber}`}>
          <Eye className="h-4 w-4" />
        </Link>
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={onEdit} aria-label={`Edit order ${order.orderNumber}`} title="Edit">
        <Pencil className="h-4 w-4" />
      </Button>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground data-[state=open]:bg-muted" aria-label={`More actions for ${order.orderNumber}`} title="More">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem className="cursor-pointer" onClick={onView}>
            <Eye className="mr-2 h-4 w-4" />
            View details
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={sendWhatsAppMessage}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Send on WhatsApp
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
