"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Receipt } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderReversalDialog } from "@/components/admin/orders/order-reversal-dialog";
import { updateOrderStatus } from "@/lib/orders/actions";
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABEL,
  ORDER_TYPE_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
} from "@/lib/orders/schemas";
import { formatMoney } from "@/lib/orders/types";
import { OrderStatus } from "@/generated/prisma/enums";
import type {
  OrderType,
  PaymentMethod,
  PaymentStatus,
} from "@/generated/prisma/enums";

export type OrderListItem = {
  id: string;
  orderNumber: number;
  type: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  total: number;
  currency: string;
  placedAt: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  note: string | null;
  items: {
    id: string;
    name: string;
    quantity: number;
    lineTotal: number;
    note: string | null;
    choices: { id: string; groupLabel: string; name: string }[];
  }[];
};

const STATUS_VARIANT: Record<
  OrderStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  PREPARING: "default",
  READY: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

const ACTION_LABEL: Record<OrderStatus, string> = {
  PENDING: "Späť na čakajúce",
  CONFIRMED: "Potvrdiť",
  PREPARING: "Začať prípravu",
  READY: "Pripravené",
  COMPLETED: "Dokončiť",
  CANCELLED: "Zrušiť",
  REFUNDED: "Refundovať",
};

export function OrdersBoard({ orders }: { orders: OrderListItem[] }) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        <Receipt className="size-10" />
        <p>Zatiaľ žiadne objednávky.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

const REVERSAL_STATUSES = new Set<OrderStatus>([
  OrderStatus.CANCELLED,
  OrderStatus.REFUNDED,
]);

function OrderCard({ order }: { order: OrderListItem }) {
  const [pending, startTransition] = useTransition();
  const nextStatuses = ORDER_STATUS_FLOW[order.status] ?? [];

  function changeStatus(next: OrderStatus) {
    startTransition(async () => {
      const res = await updateOrderStatus(order.id, next);
      if (res.ok) {
        toast.success(`Objednávka #${order.orderNumber}: ${ORDER_STATUS_LABEL[next]}.`);
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">#{order.orderNumber}</span>
            <Badge variant="outline" className="font-normal">
              {ORDER_TYPE_LABEL[order.type]}
            </Badge>
            <span className="text-sm text-muted-foreground">{order.placedAt}</span>
          </div>
          <Badge variant={STATUS_VARIANT[order.status]}>
            {ORDER_STATUS_LABEL[order.status]}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary" className="font-normal">
            {PAYMENT_STATUS_LABEL[order.paymentStatus]}
          </Badge>
          {order.paymentMethod && (
            <span>{PAYMENT_METHOD_LABEL[order.paymentMethod]}</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {(order.customerName || order.customerPhone || order.customerEmail) && (
          <div className="text-sm">
            {order.customerName && (
              <span className="font-medium">{order.customerName}</span>
            )}
            {order.customerPhone && (
              <span className="text-muted-foreground"> · {order.customerPhone}</span>
            )}
            {order.customerEmail && (
              <span className="text-muted-foreground"> · {order.customerEmail}</span>
            )}
          </div>
        )}

        <ul className="space-y-1 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-2">
              <span>
                <span className="tabular-nums">{item.quantity}×</span> {item.name}
                {item.choices.length > 0 && (
                  <span className="text-muted-foreground">
                    {" "}
                    ({item.choices.map((c) => c.name).join(", ")})
                  </span>
                )}
                {item.note && (
                  <span className="text-muted-foreground"> — {item.note}</span>
                )}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {formatMoney(item.lineTotal, order.currency)}
              </span>
            </li>
          ))}
        </ul>

        {order.note && (
          <p className="rounded-md bg-muted px-3 py-2 text-sm">
            Poznámka: {order.note}
          </p>
        )}

        <Separator />

        <div className="flex items-center justify-between">
          <span className="font-semibold tabular-nums">
            {formatMoney(order.total, order.currency)}
          </span>
          <div className="flex flex-wrap justify-end gap-2">
            {nextStatuses.map((next) => {
              const isReversal = REVERSAL_STATUSES.has(next);
              const btn = (
                <Button
                  key={next}
                  size="sm"
                  variant={isReversal ? "outline" : "default"}
                  disabled={pending}
                  onClick={
                    isReversal ? undefined : () => changeStatus(next)
                  }
                  className={
                    isReversal
                      ? "text-destructive hover:text-destructive"
                      : undefined
                  }
                >
                  {ACTION_LABEL[next]}
                </Button>
              );

              if (
                next === OrderStatus.CANCELLED ||
                next === OrderStatus.REFUNDED
              ) {
                return (
                  <OrderReversalDialog
                    key={next}
                    orderId={order.id}
                    orderNumber={order.orderNumber}
                    currentStatus={order.status}
                    nextStatus={next}
                    trigger={btn}
                  />
                );
              }

              return btn;
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
