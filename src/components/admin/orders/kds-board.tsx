"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChefHat } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { refreshStoreOrdersBoard, updateOrderStatus } from "@/lib/orders/actions";
import { useOrdersRealtime } from "@/lib/orders/use-orders-realtime";
import {
  ORDER_STATUS_LABEL,
  ORDER_TYPE_LABEL,
} from "@/lib/orders/schemas";
import { OrderStatus } from "@/generated/prisma/enums";
import type { OrderListItem } from "@/components/admin/orders/orders-board";

const KDS_COLUMNS: {
  key: OrderStatus;
  title: string;
  action?: { next: OrderStatus; label: string };
}[] = [
  {
    key: OrderStatus.CONFIRMED,
    title: "Nové",
    action: { next: OrderStatus.PREPARING, label: "Začať prípravu" },
  },
  {
    key: OrderStatus.PREPARING,
    title: "Pripravuje sa",
    action: { next: OrderStatus.READY, label: "Hotové" },
  },
  { key: OrderStatus.READY, title: "Pripravené" },
];

export function KdsBoard({
  storeId,
  orders: initialOrders,
  liveRefresh = true,
}: {
  storeId: string;
  orders: OrderListItem[];
  liveRefresh?: boolean;
}) {
  const [orders, setOrders] = useState(initialOrders);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const refresh = useCallback(async () => {
    try {
      const fresh = await refreshStoreOrdersBoard(storeId);
      setOrders(fresh);
    } catch {
      // Ďalší realtime event alebo fallback polling skúsi znova.
    }
  }, [storeId]);

  useOrdersRealtime({
    storeId,
    enabled: liveRefresh,
    onRefresh: refresh,
    playChime: true,
  });

  const kitchenOrders = orders.filter((o) =>
    KDS_COLUMNS.some((col) => col.key === o.status),
  );

  if (kitchenOrders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-16 text-center text-muted-foreground">
        <ChefHat className="size-12" />
        <p>Žiadne objednávky v kuchyni.</p>
        <p className="text-sm">Nové objednávky sa zobrazia automaticky.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {KDS_COLUMNS.map((column) => (
        <KdsColumn
          key={column.key}
          title={column.title}
          orders={kitchenOrders.filter((o) => o.status === column.key)}
          action={column.action}
        />
      ))}
    </div>
  );
}

function KdsColumn({
  title,
  orders,
  action,
}: {
  title: string;
  orders: OrderListItem[];
  action?: { next: OrderStatus; label: string };
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Badge variant="secondary">{orders.length}</Badge>
      </div>
      <div className="flex flex-col gap-3">
        {orders.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Prázdne
          </p>
        ) : (
          orders.map((order) => (
            <KdsOrderCard key={order.id} order={order} action={action} />
          ))
        )}
      </div>
    </section>
  );
}

function KdsOrderCard({
  order,
  action,
}: {
  order: OrderListItem;
  action?: { next: OrderStatus; label: string };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function advance() {
    if (!action) return;
    startTransition(async () => {
      const res = await updateOrderStatus(order.id, action.next);
      if (res.ok) {
        toast.success(
          `#${order.orderNumber} → ${ORDER_STATUS_LABEL[action.next]}`,
        );
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-2xl font-bold tabular-nums">
            #{order.orderNumber}
          </span>
          <Badge variant="outline">{ORDER_TYPE_LABEL[order.type]}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{order.placedAt}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2 text-base">
          {order.items.map((item) => (
            <li key={item.id}>
              <span className="font-semibold tabular-nums">
                {item.quantity}×
              </span>{" "}
              {item.name}
              {item.choices.length > 0 && (
                <span className="block text-sm text-muted-foreground">
                  {item.choices.map((c) => c.name).join(", ")}
                </span>
              )}
              {item.note && (
                <span className="block text-sm font-medium text-amber-700 dark:text-amber-400">
                  {item.note}
                </span>
              )}
            </li>
          ))}
        </ul>

        {order.note && (
          <p className="rounded-md bg-muted px-3 py-2 text-sm">
            {order.note}
          </p>
        )}

        {action && (
          <Button
            className="w-full"
            size="lg"
            disabled={pending}
            onClick={advance}
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
