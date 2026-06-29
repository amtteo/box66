import type { OrderListItem } from "@/components/admin/orders/orders-board";
import type { StoreOrderRow } from "@/lib/orders/queries";

const dateFmt = new Intl.DateTimeFormat("sk-SK", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function storeOrdersToListItems(orders: StoreOrderRow[]): OrderListItem[] {
  return orders.map((o) => ({
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
}
