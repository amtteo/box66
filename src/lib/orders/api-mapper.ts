import type { ApiOrder } from "@/lib/orders/api-types";
import type { StoreOrderRow } from "@/lib/orders/queries";
import {
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
} from "@/generated/prisma/enums";

export function mapApiOrderToStoreRow(order: ApiOrder): StoreOrderRow {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    type: order.type as OrderType,
    status: order.status as OrderStatus,
    paymentStatus: order.paymentStatus as PaymentStatus,
    paymentMethod: (order.paymentMethod as PaymentMethod | null) ?? null,
    total: order.total,
    currency: order.currency,
    customerName: order.customerName ?? null,
    customerEmail: order.customerEmail ?? null,
    customerPhone: order.customerPhone ?? null,
    note: order.note ?? null,
    placedAt: new Date(order.placedAt),
    customer: null,
    items: order.items.map((item) => ({
      id: item.id,
      nameSnapshot: item.nameSnapshot,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      note: item.note ?? null,
      choices: (item.choices ?? []).map((c) => ({
        id: c.id,
        groupLabel: c.groupLabel,
        nameSnapshot: c.nameSnapshot,
      })),
    })),
  };
}
