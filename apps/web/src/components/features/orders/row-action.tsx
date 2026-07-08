'use client';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { OrderDto } from '@/dtos/order.dto';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Row } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';

interface OrderListRowActionsProps<TData> {
  row: Row<TData>;
  editRecord: (id: number) => void;
  deleteRecord: (id: number) => void;
}

export function OrderRowActions<TData>({ row, editRecord, deleteRecord }: OrderListRowActionsProps<TData>) {
  const item = row.original as OrderDto;
  const router = useRouter();

  const sendWhatsAppMessage = () => {
    if (!item) return;

    // Format the message
    const message = `Order Details:
Order #: ${item.orderNumber || item.id || 'N/A'}
Date: ${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
Total: $${item.grandTotal || '0.00'}

Items:
${item.items && item.items.length > 0 
  ? item.items.map(oItem => `- Product ID: ${oItem.productId} x${oItem.quantity || 1} - $${oItem.unitPrice}`).join('\n')
  : 'No items'}

Customer ID: ${item.customerId || 'N/A'}`;

    const encodedMessage = encodeURIComponent(message);
    const rawPhone = '1234567890'; // Change to actual test or customer phone number
    const phoneNumber = rawPhone.replace(/[^\d+]/g, ''); 
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-3 w-8 p-0 data-[state=open]:bg-muted">
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[160px]">
        <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/admin/orders/${item.id}`)}>
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={sendWhatsAppMessage}>
          Send on WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={() => editRecord(item.id)}>
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={() => deleteRecord(item.id)}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

