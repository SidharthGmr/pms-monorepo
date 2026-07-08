import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { OrderDto } from '@/dtos/order.dto';
import { OrderStatus } from '@/enums/order-status.enum';
import { useGetAllOrders } from '@/hooks/service-hooks/useOrderService';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, Calendar, CheckCircle2, Clock, FileText, Package, RotateCcw, ShoppingBag, Truck, User, XCircle } from 'lucide-react';
import Link from 'next/link';
import { DashboardEmptyState } from '../skelton/empty-states';
import ProductsOrdersSkeleton from '../skelton/products-orders';
import { CardDescription } from '../ui/card';

const getStatusIcon = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.Pending:
      return <Clock className="w-5 h-5" />;
    case OrderStatus.Confirmed:
      return <FileText className="w-5 h-5" />;
    case OrderStatus.Shipped:
      return <Truck className="w-5 h-5" />;
    case OrderStatus.Delivered:
      return <CheckCircle2 className="w-5 h-5" />;
    case OrderStatus.Cancelled:
      return <XCircle className="w-5 h-5" />;
    case OrderStatus.Returned:
      return <RotateCcw className="w-5 h-5" />;
    default:
      return <ShoppingBag className="w-5 h-5" />;
  }
};

const getStatusBadge = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.Pending:
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800 text-[10px] rounded px-1.5 py-0">Pending</Badge>;
    case OrderStatus.Confirmed:
      return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 text-[10px] rounded px-1.5 py-0">Confirmed</Badge>;
    case OrderStatus.Shipped:
      return <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800 text-[10px] rounded px-1.5 py-0">Shipped</Badge>;
    case OrderStatus.Delivered:
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 text-[10px] rounded px-1.5 py-0">Delivered</Badge>;
    case OrderStatus.Cancelled:
      return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 text-[10px] rounded px-1.5 py-0">Cancelled</Badge>;
    case OrderStatus.Returned:
      return <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800 text-[10px] rounded px-1.5 py-0">Returned</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px] rounded px-1.5 py-0">{status}</Badge>;
  }
};

const getStatusIconStyles = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.Pending:
      return 'bg-amber-50 text-amber-500 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50';
    case OrderStatus.Confirmed:
      return 'bg-blue-50 text-blue-500 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50';
    case OrderStatus.Shipped:
      return 'bg-purple-50 text-purple-500 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/50';
    case OrderStatus.Delivered:
      return 'bg-emerald-50 text-emerald-500 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50';
    case OrderStatus.Cancelled:
      return 'bg-rose-50 text-rose-500 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50';
    case OrderStatus.Returned:
      return 'bg-orange-50 text-orange-500 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/50';
    default:
      return 'bg-primary/5 text-primary border-primary/10';
  }
};

export default function RecentOrdersList() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  const { data: response, isLoading, isError } = useGetAllOrders({ page: 1, recordPerPage: 5 });

  if (isLoading) {
    return (
      <ProductsOrdersSkeleton />
    );
  }

  if (isError) {
    return <CardDescription>{response?.data?.message || 'Something went wrong.'}</CardDescription>;
  }

  const orders: OrderDto[] = response?.data?.data?.data || [];

  return (
    <div>
      {orders.length === 0 ? (
        <DashboardEmptyState
          title="Recent Orders"
          description="No recent orders found."
          ctaUrl="/admin/products"
          ctaTitle="View All Products"
          icon={Package}
        />

      ) : (
        <div className="space-y-1">
          {orders.map((order) => {
            const customerName = order?.customer
              ? (order.customer.firstName || `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim())
              : null;

            return (
              <div key={order.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-background border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300 rounded-lg gap-4"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`flex w-11 h-11 rounded-2xl items-center justify-center border shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105 ${getStatusIconStyles(order.status)}`}>
                    {getStatusIcon(order.status)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono font-bold text-[13px] md:text-sm tracking-tight text-foreground hover:text-primary transition-all duration-200 px-2 py-0.5 bg-muted/50 hover:bg-muted/80 border border-border/40 rounded-md"
                      >
                        {order.orderNumber}
                      </Link>
                      {getStatusBadge(order.status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-medium select-none">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[11px]">
                          {order.orderDate ? unitOfService.DateTimeService.convertToLocalDate(order.orderDate, true) : '—'}
                        </span>
                      </span>

                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 text-sky-600 dark:text-sky-400 font-medium select-none">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[11px]">{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</span>
                      </span>

                      {customerName && (
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-medium truncate max-w-[150px] select-none">
                          <User className="w-3.5 h-3.5" />
                          <span className="text-[11px]">{customerName}</span>
                        </span>
                      )}

                      {order.items && order.items.length > 0 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="text-[11px] h-6 px-2.5 bg-amber-50/70 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-900/40 font-semibold cursor-help transition-all duration-300 rounded-full flex items-center gap-1.5 shadow-sm">
                                <Package className="w-3.5 h-3.5" />
                                {order.items.reduce((sum, item) => sum + item.quantity, 0)} Items
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="p-3.5 w-[290px] shadow-2xl border-border bg-background/95 backdrop-blur-md rounded-xl select-none">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-1">
                                  <p className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                    <Package className="w-3.5 h-3.5 text-primary opacity-80" />
                                    Products in Order
                                  </p>
                                  <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 py-0 bg-primary/10 text-primary border-none font-semibold">
                                    {order.items.length} {order.items.length === 1 ? 'type' : 'types'}
                                  </Badge>
                                </div>
                                <ul className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1.5 custom-scrollbar">
                                  {order.items.map(item => (
                                    <li key={item.id} className="text-xs flex items-start justify-between gap-3 group/item">
                                      <div className="flex flex-col min-w-0 flex-1">
                                        <span className="truncate font-semibold text-foreground group-hover/item:text-primary transition-colors text-[11px] leading-tight">
                                          {item.product?.name || `Product #${item.productId}`}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground/80 mt-0.5">
                                          ${item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} each
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2.5 shrink-0 self-center">
                                        <span className="text-[10px] font-bold text-muted-foreground bg-muted border border-border/40 px-1.5 py-0.5 rounded">
                                          x{item.quantity}
                                        </span>
                                        <span className="font-bold text-foreground text-right min-w-[55px]">
                                          ${item.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                                {(order.discount > 0 || order.tax > 0) && (
                                  <div className="border-t border-border/50 pt-2 mt-1 space-y-1">
                                    {order.discount > 0 && (
                                      <div className="flex justify-between text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                        <span>Discount</span>
                                        <span>-${Number(order.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                      </div>
                                    )}
                                    {order.tax > 0 && (
                                      <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                                        <span>Tax</span>
                                        <span>+${Number(order.tax).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="bg-muted/50 dark:bg-muted/20 border border-border/40 hover:border-primary/20 px-3.5 py-2 rounded-2xl flex items-center gap-2.5 transition-all duration-300">
                    <span className="text-base font-extrabold text-foreground">
                      ${order.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <Link href={`/admin/orders/${order.id}`}>
                      <Button variant="ghost" size="icon" className="h-6.5 w-6.5 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-300">
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
