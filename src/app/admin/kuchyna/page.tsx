import type { Metadata } from "next";

import { requireActiveStore } from "@/lib/auth/tenancy";
import { Role } from "@/lib/rbac";
import { getStoreOrders } from "@/lib/orders/queries";
import { storeOrdersToListItems } from "@/lib/orders/board";
import { KdsBoard } from "@/components/admin/orders/kds-board";
import { OrderStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Kuchyňa (KDS)" };

export default async function KuchynaPage() {
  const { store } = await requireActiveStore(Role.STAFF);
  const orders = await getStoreOrders(store.id);
  const items = storeOrdersToListItems(orders);

  const activeCount = items.filter((o) =>
    (
      [
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        OrderStatus.READY,
      ] as OrderStatus[]
    ).includes(o.status),
  ).length;

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Kuchyňa (KDS)
        </h1>
        <p className="text-sm text-muted-foreground">
          {store.name} — {activeCount}{" "}
          {activeCount === 1 ? "aktívna objednávka" : "aktívnych objednávok"}.
          Živé aktualizácie cez Supabase Realtime.
        </p>
      </div>

      <KdsBoard storeId={store.id} orders={items} />
    </>
  );
}
