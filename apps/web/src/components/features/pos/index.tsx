'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';
import { ProductDto } from '@/dtos/product.dto';
import { OrderStatus } from '@/enums/order-status.enum';
import { useCreateOrder } from '@/hooks/service-hooks/useOrderService';
import { useGetAllProducts } from '@/hooks/service-hooks/useProductService';
import { ArrowLeft, Minus, Plus, ShoppingBag, ShoppingCart, Trash2, Search, Percent, Landmark, FileText } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

const CheckoutSchema = yup.object().shape({
  discount: yup.number().min(0, 'Must be >= 0').typeError('Must be a number').optional().default(0),
  tax: yup.number().min(0, 'Must be >= 0').typeError('Must be a number').optional().default(0),
  shippingCost: yup.number().min(0, 'Must be >= 0').typeError('Must be a number').optional().default(0),
  notes: yup.string().optional(),
});

type CheckoutFormValues = yup.InferType<typeof CheckoutSchema>;

interface CartItem extends ProductDto {
  cartQuantity: number;
}

export default function PurchasePage() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const { data: session } = useSession();
  const customerId = '7659f57e-e2d1-465e-9f9b-4aa946d227e3';
  const { data: productsResponse, isLoading } = useGetAllProducts();
  const createOrderMutation = useCreateOrder();
  const [cart, setCart] = useState<Record<number, CartItem>>({});
  const [view, setView] = useState<'products' | 'cart'>('products');
  const [searchTerm, setSearchTerm] = useState('');

  const form = useForm<CheckoutFormValues>({
    resolver: yupResolver(CheckoutSchema),
    defaultValues: { discount: 0, tax: 0, shippingCost: 0, notes: '' },
  });

  const products: ProductDto[] = productsResponse?.data?.data?.data || [];

  const handleAddToCart = (product: ProductDto) => {
    setCart((prev) => {
      const current = prev[product.id];
      const newQuantity = current ? current.cartQuantity + 1 : 1;

      if (newQuantity > product.stock) {
        toast({ variant: 'destructive', title: 'Out of stock', description: `Cannot add more than ${product.stock} items.` });
        return prev;
      }

      return {
        ...prev,
        [product.id]: { ...product, cartQuantity: newQuantity },
      };
    });
  };

  const handleRemoveFromCart = (productId: number) => {
    setCart((prev) => {
      const current = prev[productId];
      if (!current) return prev;

      if (current.cartQuantity <= 1) {
        const newCart = { ...prev };
        delete newCart[productId];
        return newCart;
      }

      return {
        ...prev,
        [productId]: { ...current, cartQuantity: current.cartQuantity - 1 },
      };
    });
  };

  const handleDeleteFromCart = (productId: number) => {
    setCart((prev) => {
      const newCart = { ...prev };
      delete newCart[productId];
      return newCart;
    });
  };

  const cartItems = Object.values(cart);
  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.cartQuantity, 0);
  const totalAmount = cartItems.reduce((acc, item) => acc + item.price * item.cartQuantity, 0);

  const { discount, tax, shippingCost } = form.watch();
  const grandTotal = totalAmount + (tax || 0) + (shippingCost || 0) - (discount || 0);

  const handleCheckout = async (data: CheckoutFormValues) => {
    if (cartItems.length === 0) return;

    if (!customerId) {
      toast({ variant: 'destructive', title: 'Checkout Failed', description: 'Customer ID is required. Please login or select a customer.' });
      return;
    }

    try {
      const orderPayload = {
        customerId,
        totalAmount,
        discount: data.discount || 0,
        tax: data.tax || 0,
        shippingCost: data.shippingCost || 0,
        grandTotal: grandTotal,
        status: OrderStatus.Pending,
        notes: data.notes,
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.cartQuantity,
          unitPrice: item.price,
          totalPrice: item.price * item.cartQuantity,
        })),
      };

      const response = await createOrderMutation.mutateAsync(orderPayload);
      if (response && (response.status === 201 || response.status === 200)) {
        toast({ variant: 'success', title: 'Order placed successfully' });
        setCart({});
        setView('products');
      } else {
        const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
        toast({ variant: 'destructive', title: 'Checkout Failed', description: <span>{error}</span> });
      }
    } catch (error: any) {
      const errorMessage = unitOfService.ErrorHandlerService.getErrorMessage(error);
      toast({ variant: 'destructive', title: 'Error', description: <span>{errorMessage || error.message || 'Unknown error occurred'}</span> });
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground font-semibold animate-pulse text-lg">Loading products...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50/40 p-4 sm:p-6 md:p-8">
      {view === 'products' ? (
        // Catalog View
        <div className="space-y-6 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black tracking-tight text-slate-800">Available Products</h2>
                <Badge className="bg-primary/10 text-primary border-none font-extrabold text-xs px-2.5 py-0.5 rounded-full">
                  {filteredProducts.length} items
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Select products and add them to your cart to prepare the order.</p>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <Input 
                  placeholder="Search products..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-9 h-10 rounded-xl bg-background border-border/40 text-sm focus-visible:ring-primary/20"
                />
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  toast({
                    variant: 'success',
                    title: 'Successful Order Placement',
                    description: 'Your purchase has been recorded. Receipt has been mailed.'
                  });
                  setTimeout(() => {
                    toast({
                      variant: 'destructive',
                      title: 'Order Placement Error',
                      description: 'Failed to authorize payment. Please check card status.'
                    });
                  }, 800);
                }}
                className="h-10 rounded-xl px-4 border-border/40 font-bold shrink-0 text-xs text-muted-foreground hover:text-foreground"
              >
                Test Toasts
              </Button>

              <Button
                onClick={() => setView('cart')}
                className="relative h-10 rounded-xl px-5 bg-primary hover:bg-primary/95 text-white font-bold flex items-center gap-2 shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5 active:translate-y-0 shrink-0"
              >
                <ShoppingCart className="w-4.5 h-4.5" />
                <span>View Cart</span>
                {totalItemsCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-extrabold text-[10px] px-1.5 py-0.5 rounded-full shadow-md animate-pulse">
                    {totalItemsCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => {
                const inCartQty = cart[product.id]?.cartQuantity || 0;
                const isLowStock = product.stock <= (product.lowStockThreshold || 5);

                return (
                  <Card key={product.id} className="group relative overflow-hidden bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60 hover:border-primary/30 dark:hover:border-primary/30 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_35px_-8px_rgba(0,0,0,0.12)] transition-all duration-500 rounded-[28px] flex flex-col justify-between h-[360px] backdrop-blur-md">
                    {/* Image Area */}
                    <div className="h-[190px] bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950 dark:to-slate-900/50 relative overflow-hidden flex items-center justify-center border-b border-slate-100 dark:border-slate-800/40">
                      {product.images && product.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={product.images[0]} 
                          alt={product.name} 
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out" 
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 group-hover:scale-105 transition-transform duration-500">
                          <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-500/80 dark:text-indigo-400/80">
                            <ShoppingBag className="w-8 h-8" />
                          </div>
                        </div>
                      )}

                      {/* Stock status tag (top-left) */}
                      <div className="absolute top-3.5 left-3.5">
                        {product.stock <= 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-lg shadow-rose-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            Sold Out
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-lg shadow-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-lg shadow-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            In Stock
                          </span>
                        )}
                      </div>

                      {/* Glassmorphic Overlay for Sold Out */}
                      {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/60 flex items-center justify-center backdrop-blur-[3px] transition-all duration-300">
                          <div className="px-4 py-2 rounded-xl bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-md shadow-2xl scale-95 group-hover:scale-100 transition-transform duration-500">
                            <span className="text-white font-black text-xs uppercase tracking-widest">OUT OF STOCK</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content Area */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                          product.stock <= 0 ? 'text-rose-500/80' : isLowStock ? 'text-amber-500/80' : 'text-emerald-500/80'
                        }`}>
                          {product.stock > 0 ? `${product.stock} Units Available` : 'No Stock'}
                        </span>
                        <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-primary transition-colors min-h-[40px]">
                          {product.name}
                        </h3>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                        <span className="text-lg font-black text-slate-900 dark:text-white">${product.price.toFixed(2)}</span>
                        
                        {inCartQty > 0 ? (
                          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 rounded-xl p-1 border border-slate-200/40 dark:border-slate-800/40 shadow-inner">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all active:scale-95" 
                              onClick={() => handleRemoveFromCart(product.id)}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </Button>
                            <span className="w-6 text-center text-xs font-black text-slate-800 dark:text-slate-200">{inCartQty}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all active:scale-95"
                              onClick={() => handleAddToCart(product)}
                              disabled={inCartQty >= product.stock}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(product)}
                            disabled={product.stock <= 0}
                            className={`h-8.5 rounded-xl font-bold px-4 transition-all duration-300 shadow-md ${
                              product.stock <= 0 
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200/40 dark:border-slate-800/40 shadow-none' 
                                : 'bg-primary hover:bg-primary/90 text-white shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Add
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full py-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3 bg-white border border-border/40 rounded-3xl">
                <ShoppingBag className="w-10 h-10 text-muted-foreground/30" />
                <p className="font-semibold text-sm">No products match your search.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Cart / Checkout View
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
            <div className="space-y-1">
              <Button 
                variant="ghost" 
                onClick={() => setView('products')} 
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground mb-1 p-0 hover:bg-transparent"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Back to Products</span>
              </Button>
              <h2 className="text-2xl font-black tracking-tight text-slate-800">Review & Checkout</h2>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-extrabold text-xs px-3 py-1 rounded-full w-fit">
              {totalItemsCount} items selected
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column: Cart Items List */}
            <div className="lg:col-span-2 space-y-3">
              {cartItems.length > 0 ? (
                cartItems.map((item) => (
                  <Card key={item.id} className="group overflow-hidden bg-card border border-border/50 hover:border-primary/20 shadow-sm transition-all duration-300 rounded-2xl p-4 flex flex-row items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-border/30">
                      {item.images && item.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.images[0]} alt={item.name} className="object-cover w-full h-full" />
                      ) : (
                        <div className="text-xl">📦</div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="font-bold text-sm text-slate-800 truncate group-hover:text-primary transition-colors">{item.name}</h4>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        <span>Unit: ${item.price.toFixed(2)}</span>
                        <span className="w-1 h-1 rounded-full bg-border shrink-0" />
                        <span className={item.stock <= item.cartQuantity ? 'text-amber-600 font-semibold' : ''}>
                          Max Available: {item.stock}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 shrink-0">
                      {/* Quantity Selector */}
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl p-0.5 border border-border/40">
                        <Button variant="ghost" size="icon" className="h-6.5 w-6.5 rounded-lg" onClick={() => handleRemoveFromCart(item.id)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-5 text-center text-xs font-bold text-slate-800 dark:text-slate-200">{item.cartQuantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6.5 w-6.5 rounded-lg"
                          onClick={() => handleAddToCart(item)}
                          disabled={item.cartQuantity >= item.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <span className="text-sm font-extrabold text-foreground block">${(item.price * item.cartQuantity).toFixed(2)}</span>
                      </div>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground/50 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-full"
                        onClick={() => handleDeleteFromCart(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3 bg-white border border-border/40 rounded-3xl">
                  <div className="p-4 rounded-full bg-slate-100 text-muted-foreground/35">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-slate-400">Your cart is empty</p>
                  <Button size="sm" onClick={() => setView('products')} className="rounded-xl px-5 font-bold shadow-md">
                    Return to Catalog
                  </Button>
                </div>
              )}
            </div>

            {/* Right Column: Checkout Summary Forms */}
            <div className="lg:col-span-1">
              <Card className="shadow-lg border border-border/50 rounded-3xl overflow-hidden bg-background">
                <CardHeader className="border-b px-5 py-4 bg-slate-50/50 dark:bg-slate-900/10">
                  <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-primary" />
                    Summary
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-5 space-y-4">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleCheckout)} className="space-y-4" autoComplete="off">
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="discount"
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Percent className="w-3.5 h-3.5 opacity-60" />
                                Discount ($)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  className="h-9 rounded-xl text-xs bg-muted/30 border-border/40 focus-visible:ring-primary/20"
                                  value={field.value ?? ''}
                                  onChange={(e) => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="tax"
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Landmark className="w-3.5 h-3.5 opacity-60" />
                                Tax ($)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  className="h-9 rounded-xl text-xs bg-muted/30 border-border/40 focus-visible:ring-primary/20"
                                  value={field.value ?? ''}
                                  onChange={(e) => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 opacity-60" />
                              Order Notes
                            </FormLabel>
                            <FormControl>
                              <Textarea placeholder="Add special instructions..." {...field} value={field.value ?? ''} className="min-h-[60px] h-[60px] rounded-xl text-xs bg-muted/30 border-border/40 py-2 px-3 focus-visible:ring-primary/20" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="pt-4 border-t border-border/20 space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                          <span>Subtotal</span>
                          <span>${totalAmount.toFixed(2)}</span>
                        </div>
                        {tax > 0 && (
                          <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                            <span>Tax</span>
                            <span>+${tax.toFixed(2)}</span>
                          </div>
                        )}
                        {discount > 0 && (
                          <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                            <span>Discount</span>
                            <span>-${discount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-baseline pt-2 border-t border-border/20">
                          <span className="text-sm font-bold text-slate-700">Grand Total</span>
                          <span className="text-xl font-black text-primary">${grandTotal.toFixed(2)}</span>
                        </div>
                      </div>

                      <Button
                        className="w-full h-10 text-xs font-black shadow-lg shadow-primary/10 hover:shadow-xl hover:translate-y-[-1.5px] active:translate-y-[0px] rounded-xl transition-all mt-4"
                        disabled={cartItems.length === 0 || createOrderMutation.isPending}
                        type="submit"
                        loading={createOrderMutation.isPending}
                      >
                        Complete Purchase
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
