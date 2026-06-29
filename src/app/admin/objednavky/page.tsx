import type { Metadata } from "next";

import { requireActiveStore } from "@/lib/auth/tenancy";
import { Role } from "@/lib/rbac";
import { getStoreOrders } from "@/lib/orders/queries";
import { storeOrdersToListItems } from "@/lib/orders/board";
import {
  OrdersBoard,
} from "@/components/admin/orders/orders-board";

export const metadata: Metadata = { title: "Objednávky" };

export default async function ObjednavkyPage() {
  const { store } = await requireActiveStore(Role.STAFF);
  const orders = await getStoreOrders(store.id);
  const items = storeOrdersToListItems(orders);

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
          Živé aktualizácie cez Supabase Realtime.
        </p>
      </div>

      <OrdersBoard
        storeId={store.id}
        orders={items}
        liveRefresh
      />
    </>
  );
}
