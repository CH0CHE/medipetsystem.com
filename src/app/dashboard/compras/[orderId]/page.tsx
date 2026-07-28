"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PurchaseOrderDetailView } from "@/components/purchases/purchase-order-detail";

export default function OrdenCompraDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-up">
      <Link href="/dashboard/compras" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Volver a compras
      </Link>
      <PurchaseOrderDetailView purchaseOrderId={orderId} />
    </div>
  );
}
