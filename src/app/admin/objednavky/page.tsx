import type { Metadata } from "next";

import { requireActiveStore } from "@/lib/auth/tenancy";
import { Role } from "@/lib/rbac";
import { getStoreOrders } from "@/lib/orders/queries";
import {
  OrdersBoard,
  type OrderListItem,
} from "@/components/admin/orders/orders-board";

export const metadata: Metadata = { title: "Objednávky" };

const dateFmt = new Intl.DateTimeFormat("sk-SK", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function ObjednavkyPage() {
  const { store } = await requireActiveStore(Role.STAFF);
  const orders = await getStoreOrders(store.id);

  const items: OrderListItem[] = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    type: o.type,
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    total: Number(o.total),
    currency: o.currency,
    placedAt: dateFmt.format(o.placedAt),
    customerName: o.customerName ?? o.customer?.fullName ?? null,
    customerEmail: o.customerEmail ?? o.customer?.email ?? null,
    customerPhone: o.customerPhone ?? null,
    note: o.note,
    items: o.items.map((i) => ({
      id: i.id,
      name: i.nameSnapshot,
      quantity: i.quantity,
      lineTotal: Number(i.lineTotal),
      note: i.note,
      choices: i.choices.map((c) => ({
        id: c.id,
        groupLabel: c.groupLabel,
        name: c.nameSnapshot,
      })),
    })),
  }));

  const openCount = items.filter(
    (o) =>
      o.status !== "COMPLETED" &&
      o.status !== "CANCELLED" &&
      o.status !== "REFUNDED",
  ).length;

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Objednávky</h1>
        <p className="text-sm text-muted-foreground">
          {store.name} — {openCount}{" "}
          {openCount === 1 ? "otvorená objednávka" : "otvorených objednávok"}.
          Potvrdením objednávky sa automaticky odpočíta sklad cez receptúru.
        </p>
      </div>

      <OrdersBoard orders={items} />
    </>
  );
}
