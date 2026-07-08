"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { container } from "@/config/ioc";
import { TYPES } from "@/config/types";
import { useGetOrderById } from "@/hooks/service-hooks/useOrderService";
import IUnitOfService from "@/services/interfaces/IUnitOfService";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeAlert,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Edit2,
  FileSpreadsheet,
  FileText,
  Hash,
  HelpCircle,
  Package,
  Receipt,
  ShoppingBag,
  Store,
  Truck,
  User
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import BillReceipt from "./bill-receipt";
import OrderWhatsApp from "@/components/common/OrderWhatsApp";

interface OrderDetailsViewProps {
  id: number;
  onEdit?: (id: number) => void;
}

export default function OrderDetailsView({ id, onEdit }: OrderDetailsViewProps) {
  const router = useRouter();
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const { data: response, isLoading, isError } = useGetOrderById(id);
  const order = response?.data?.data;

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const generatePdf = async () => {
    if (!receiptRef.current) return;
    try {
      setIsGeneratingPdf(true);
      const canvas = await html2canvas(receiptRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Order_Bill_${order?.orderNumber}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(label);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[450px] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary" />
          <Package className="absolute h-6 w-6 text-primary animate-pulse" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-foreground">Loading order details</p>
          <p className="text-xs text-muted-foreground">Retrieving secure transaction record...</p>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <Card className="border-destructive/20 bg-destructive/5 max-w-2xl mx-auto p-8 text-center shadow-lg rounded-2xl">
        <div className="p-4 rounded-full bg-destructive/10 text-destructive w-fit mx-auto mb-5 animate-bounce">
          <BadgeAlert className="h-10 w-10" />
        </div>
        <h3 className="font-bold text-xl text-destructive tracking-tight">Failed to Load Order</h3>
        <p className="text-sm text-muted-foreground mt-2 mb-6 max-w-md mx-auto">
          The requested order ID may be invalid, expired, or your account lacks the necessary permissions to access this dashboard.
        </p>
        <Button variant="outline" className="shadow-sm" onClick={() => router.push("/admin/orders")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
        </Button>
      </Card>
    );
  }

  const datePlaced = order.createdAt
    ? unitOfService.DateTimeService.convertToLocalDate(order.createdAt, true)
    : "—";

  const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode; bgLight: string }> = {
    PENDING: {
      label: "Pending Review",
      color: "text-amber-600 dark:text-amber-400 border-amber-500/20",
      bgLight: "bg-amber-500/10",
      icon: <HelpCircle className="h-4 w-4" />
    },
    CONFIRMED: {
      label: "Confirmed",
      color: "text-blue-600 dark:text-blue-400 border-blue-500/20",
      bgLight: "bg-blue-500/10",
      icon: <Package className="h-4 w-4" />
    },
    SHIPPED: {
      label: "In Transit / Shipped",
      color: "text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
      bgLight: "bg-indigo-500/10",
      icon: <Truck className="h-4 w-4" />
    },
    DELIVERED: {
      label: "Delivered",
      color: "text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      bgLight: "bg-emerald-500/10",
      icon: <CheckCircle2 className="h-4 w-4" />
    },
    CANCELLED: {
      label: "Cancelled",
      color: "text-rose-600 dark:text-rose-400 border-rose-500/20",
      bgLight: "bg-rose-500/10",
      icon: <AlertTriangle className="h-4 w-4" />
    },
    RETURNED: {
      label: "Returned",
      color: "text-orange-600 dark:text-orange-400 border-orange-500/20",
      bgLight: "bg-orange-500/10",
      icon: <ArrowLeft className="h-4 w-4" />
    },
  };

  const statusKey = order.status?.toUpperCase() || "PENDING";
  const activeStatus = statusMap[statusKey] || {
    label: order.status,
    color: "text-slate-600 border-slate-500/20",
    bgLight: "bg-slate-500/10",
    icon: <HelpCircle className="h-4 w-4" />
  };

  // Timeline Step calculation
  const timelineSteps = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];
  const currentStepIndex = timelineSteps.indexOf(statusKey);
  const isSpecialStatus = ["CANCELLED", "RETURNED"].includes(statusKey);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Action Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-5 border rounded-2xl shadow-sm">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1 bg-primary/5 text-primary px-3 py-1 rounded-lg border border-primary/10 font-mono text-sm font-semibold">
              <Hash className="h-3.5 w-3.5 opacity-70" />
              <span>{order.orderNumber}</span>
            </div>
            <Badge variant="outline" className={`text-xs font-semibold px-3 py-1 rounded-full border flex items-center gap-1.5 ${activeStatus.bgLight} ${activeStatus.color}`}>
              {activeStatus.icon}
              {activeStatus.label}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>Date Placed: <strong className="text-foreground font-medium">{datePlaced}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap md:flex-nowrap">
          <Button variant="outline" size="sm" className="h-9 font-medium shadow-sm flex-1 md:flex-initial" onClick={() => router.push("/admin/orders")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 font-medium shadow-sm flex-1 md:flex-initial border-primary/20 text-primary hover:bg-primary/5"
              >
                <FileText className="h-4 w-4 mr-2" />
                Preview Bill
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <DialogTitle>Bill Preview</DialogTitle>
                <Button 
                  size="sm" 
                  onClick={generatePdf} 
                  disabled={isGeneratingPdf}
                  className="bg-primary hover:bg-primary/95 text-primary-foreground mr-6"
                >
                  <Download className={`h-4 w-4 mr-2 ${isGeneratingPdf ? "animate-bounce" : ""}`} />
                  {isGeneratingPdf ? "Generating..." : "Download PDF"}
                </Button>
              </DialogHeader>
              <div className="p-4 bg-muted/30 rounded-lg border">
                <div ref={receiptRef} className="bg-white">
                  <BillReceipt order={order} />
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <OrderWhatsApp order={order} />
          {onEdit && (
            <Button size="sm" className="h-9 font-medium shadow-sm flex-1 md:flex-initial bg-primary hover:bg-primary/95 text-primary-foreground" onClick={() => onEdit(order.id)}>
              <Edit2 className="h-4 w-4 mr-2" /> Edit Order
            </Button>
          )}
        </div>
      </div>

      {/* Order Status Stepper */}
      {!isSpecialStatus && (
        <Card className="border border-border/60 shadow-sm rounded-2xl overflow-hidden">
          <div className="p-6 bg-muted/20">
            <div className="relative flex justify-between items-center max-w-3xl mx-auto">
              {/* Stepper Progress Bar */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-border -translate-y-1/2 rounded-full -z-10" />
              <div
                className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full -z-10 transition-all duration-500 ease-out"
                style={{ width: `${(currentStepIndex / (timelineSteps.length - 1)) * 100}%` }}
              />

              {timelineSteps.map((step, idx) => {
                const isCompleted = idx < currentStepIndex;
                const isActive = idx === currentStepIndex;
                const isUpcoming = idx > currentStepIndex;

                let stepIcon = <HelpCircle className="h-4 w-4" />;
                if (step === "PENDING") stepIcon = <FileSpreadsheet className="h-4 w-4" />;
                if (step === "CONFIRMED") stepIcon = <Package className="h-4 w-4" />;
                if (step === "SHIPPED") stepIcon = <Truck className="h-4 w-4" />;
                if (step === "DELIVERED") stepIcon = <CheckCircle2 className="h-4 w-4" />;

                return (
                  <div key={step} className="flex flex-col items-center space-y-2">
                    <div className={`
                      h-10 w-10 rounded-full flex items-center justify-center border transition-all duration-300
                      ${isCompleted ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/30" : ""}
                      ${isActive ? "bg-background border-primary text-primary ring-4 ring-primary/10 font-bold scale-110 shadow-md" : ""}
                      ${isUpcoming ? "bg-background border-border text-muted-foreground" : ""}
                    `}>
                      {isCompleted ? <Check className="h-5 w-5" /> : stepIcon}
                    </div>
                    <span className={`text-[11px] font-semibold tracking-wide uppercase transition-colors duration-300
                      ${isActive ? "text-primary font-bold" : "text-muted-foreground"}
                      ${isCompleted ? "text-foreground font-medium" : ""}
                    `}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {isSpecialStatus && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${activeStatus.bgLight} ${activeStatus.color}`}>
          {activeStatus.icon}
          <div>
            <span className="font-semibold text-sm">Status Update: This order has been {activeStatus.label.toLowerCase()}.</span>
          </div>
        </div>
      )}



      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Details Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ordered Items Card */}
          <Card className="border border-border/50 shadow-sm rounded-2xl overflow-hidden bg-card">
            <CardHeader className="border-b border-border/40 py-4 px-6 bg-muted/20">
              <CardTitle className="text-base font-semibold flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                Ordered Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/10 hover:bg-muted/10">
                      <TableHead className="w-[180px] font-semibold py-3 px-6 text-xs uppercase tracking-wider">Item Details</TableHead>
                      <TableHead className="font-semibold py-3 px-4 text-xs uppercase tracking-wider text-right">Unit Price</TableHead>
                      <TableHead className="font-semibold py-3 px-4 text-xs uppercase tracking-wider text-center">Quantity</TableHead>
                      <TableHead className="font-semibold py-3 px-6 text-xs uppercase tracking-wider text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(order.items || []).map((item: any) => (
                      <TableRow key={item.id} className="hover:bg-muted/5 transition-colors">
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-mono text-xs font-semibold">
                              #{item.id}
                            </div>
                            <div>
                              <div className="font-mono text-xs font-semibold text-foreground">
                                Product ID: {item.productId}
                              </div>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded font-mono">
                                SKU: PROD-{item.productId}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right text-foreground font-medium">
                          ${item.unitPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-center">
                          <span className="inline-flex items-center justify-center bg-muted/60 text-foreground font-semibold px-2.5 py-1 rounded-md text-xs min-w-8">
                            {item.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-right text-foreground font-bold font-mono">
                          ${(item.unitPrice * item.quantity).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!order.items || order.items.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="py-12 text-center text-muted-foreground font-medium">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <ShoppingBag className="h-8 w-8 text-muted-foreground/40" />
                            <span>No items listed in this order record.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Notes Card */}
          {order.notes && (
            <Card className="border border-border/50 shadow-sm rounded-2xl overflow-hidden bg-card">
              <CardHeader className="border-b border-border/40 py-4 px-6 bg-muted/20">
                <CardTitle className="text-base font-semibold flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  Customer Instruction / Order Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="relative bg-muted/30 p-4 rounded-xl border border-border/60">
                  <span className="absolute right-3 top-3 text-muted-foreground/30 font-serif text-4xl leading-none">“</span>
                  <p className="text-sm text-foreground/80 leading-relaxed font-medium whitespace-pre-wrap pl-1 italic">
                    {order.notes}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          {/* Customer Card */}
          <Card className="border border-border/50 shadow-sm rounded-2xl bg-card overflow-hidden">
            <CardHeader className="border-b border-border/40 py-4 px-5 bg-muted/20">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Customer Info
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
                  Customer ID
                </span>
                <div className="flex items-center gap-1.5 bg-muted/50 p-2 rounded-lg border border-border/40">
                  <code className="text-xs font-mono font-medium text-foreground break-all select-all flex-1">
                    {order.customerId}
                  </code>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                          onClick={() => copyToClipboard(order.customerId, "cust")}
                        >
                          {copiedId === "cust" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{copiedId === "cust" ? "Copied!" : "Copy Customer ID"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Store Info Card */}
          <Card className="border border-border/50 shadow-sm rounded-2xl bg-card overflow-hidden">
            <CardHeader className="border-b border-border/40 py-4 px-5 bg-muted/20">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" />
                Store details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
                  Store Code
                </span>
                <div className="flex items-center gap-1.5 bg-muted/50 p-2 rounded-lg border border-border/40">
                  <code className="text-xs font-mono font-medium text-foreground break-all uppercase flex-1">
                    {order.storeCode}
                  </code>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                          onClick={() => copyToClipboard(order.storeCode, "store")}
                        >
                          {copiedId === "store" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{copiedId === "store" ? "Copied!" : "Copy Store Code"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary Card */}
          <Card className="border border-border/50 shadow-md rounded-2xl bg-card overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 to-primary" />
            <CardHeader className="border-b border-border/40 py-4 px-5 bg-muted/20">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-semibold text-foreground font-mono">${order.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Discount</span>
                  <span className="font-semibold text-rose-500 font-mono">-${order.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Tax</span>
                  <span className="font-semibold text-foreground font-mono">${order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Shipping</span>
                  <span className="font-semibold text-foreground font-mono">${order.shippingCost.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-border/80 pt-4 flex flex-col gap-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Grand Total</span>
                  <span className="text-2xl font-bold text-primary font-mono tracking-tight">
                    ${order.grandTotal.toFixed(2)}
                  </span>
                </div>
                <span className="text-[10px] text-right text-muted-foreground">
                  All taxes & custom logistics included
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
