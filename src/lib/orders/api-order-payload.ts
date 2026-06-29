import type { ApiCreateOrderRequest } from "@/lib/orders/api-types";
import type { ResolvedOrderChoice } from "@/lib/orders/resolve-choices";
import {
  OrderType,
  PaymentMethod,
} from "@/generated/prisma/enums";

type OrderLineInput = {
  menuItemId: string;
  quantity: number;
  note: string | null;
  choices: ResolvedOrderChoice[];
  loyaltyRewardId?: string;
};

type CheckoutInput = {
  type: OrderType;
  paymentMethod: PaymentMethod;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  note?: string | null;
};

/** Zostaví telo POST /stores/{id}/orders z overených riadkov košíka. */
export function buildApiCreateOrderRequest(params: {
  checkout: CheckoutInput;
  orderLines: OrderLineInput[];
  customerId: string | null;
  deliveryAddress: string | null;
  deliveryDistanceKm: number | null;
}): ApiCreateOrderRequest {
  const { checkout, orderLines, customerId, deliveryAddress, deliveryDistanceKm } =
    params;

  return {
    type: checkout.type as ApiCreateOrderRequest["type"],
    customerId: customerId ?? undefined,
    paymentMethod: checkout.paymentMethod as ApiCreateOrderRequest["paymentMethod"],
    customerName: checkout.customerName ?? undefined,
    customerEmail: checkout.customerEmail ?? undefined,
    customerPhone: checkout.customerPhone ?? undefined,
    note: checkout.note ?? undefined,
    deliveryAddress: deliveryAddress ?? undefined,
    deliveryDistanceKm:
      deliveryDistanceKm != null ? String(deliveryDistanceKm) : undefined,
    items: orderLines.map((line) => ({
      menuItemId: line.menuItemId,
      quantity: line.quantity,
      note: line.note ?? undefined,
      loyaltyRewardId: line.loyaltyRewardId,
      choices: line.choices.map((c) => ({
        groupId: c.groupId,
        productId: c.productId,
        menuItemId: c.menuItemId,
        groupLabel: c.groupLabel,
        nameSnapshot: c.nameSnapshot,
      })),
    })),
  };
}
