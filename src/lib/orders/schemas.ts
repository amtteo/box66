import * as z from "zod";

import {
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
} from "@/generated/prisma/enums";

/** Spôsoby platby ponúkané zákazníkovi na úvodnej stránke. */
export const CHECKOUT_PAYMENT_METHODS = [
  PaymentMethod.ONLINE,
  PaymentMethod.CASH,
] as const;

/** Typy objednávky ponúkané zákazníkovi na úvodnej stránke. */
export const CHECKOUT_ORDER_TYPES = [
  OrderType.DELIVERY,
  OrderType.TAKEAWAY,
  OrderType.DINE_IN,
] as const;

export const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  [OrderType.DINE_IN]: "Na mieste",
  [OrderType.TAKEAWAY]: "So sebou",
  [OrderType.DELIVERY]: "Donáška",
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "Čaká na potvrdenie",
  [OrderStatus.CONFIRMED]: "Potvrdená",
  [OrderStatus.PREPARING]: "Pripravuje sa",
  [OrderStatus.READY]: "Pripravená na výdaj",
  [OrderStatus.COMPLETED]: "Dokončená",
  [OrderStatus.CANCELLED]: "Zrušená",
  [OrderStatus.REFUNDED]: "Vrátená",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  [PaymentStatus.UNPAID]: "Nezaplatená",
  [PaymentStatus.PROCESSING]: "Spracúva sa",
  [PaymentStatus.PAID]: "Zaplatená",
  [PaymentStatus.FAILED]: "Zlyhala",
  [PaymentStatus.REFUNDED]: "Vrátená",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  [PaymentMethod.CARD]: "Kartou na mieste",
  [PaymentMethod.CASH]: "V hotovosti pri prevzatí",
  [PaymentMethod.ONLINE]: "Online kartou",
};

const optionalText = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().trim().max(500).optional(),
);

/** Jedna voľba (kombo) odoslaná klientom — overí sa na serveri. */
export const CartChoiceSchema = z.object({
  groupId: z.uuid(),
  menuItemId: z.uuid(),
});

/** Jedna položka košíka, ako ju posiela klient (cena sa dopočíta na serveri). */
export const CartItemSchema = z
  .object({
    menuItemId: z.uuid(),
    quantity: z.coerce
      .number()
      .int()
      .min(1, { error: "Množstvo musí byť aspoň 1." })
      .max(99, { error: "Maximálne 99 ks na položku." }),
    note: optionalText,
    choices: z.array(CartChoiceSchema).max(50).default([]),
    /** Vernostná odmena — cena 0 €, body sa odpočítajú pri objednávke. */
    loyaltyRewardId: z.uuid().optional(),
  })
  .superRefine((item, ctx) => {
    if (item.loyaltyRewardId && item.choices.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: "Odmena nemôže mať výber komba.",
        path: ["choices"],
      });
    }
  });

/** Payload checkoutu z úvodnej stránky (objednávka hosťa alebo prihláseného). */
export const CheckoutSchema = z.object({
  storeId: z.uuid(),
  type: z.enum(CHECKOUT_ORDER_TYPES).default(OrderType.TAKEAWAY),
  paymentMethod: z.enum(CHECKOUT_PAYMENT_METHODS, {
    error: "Vyber spôsob platby.",
  }),
  customerName: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z
      .string()
      .trim()
      .min(2, { error: "Zadaj meno (aspoň 2 znaky)." })
      .max(120)
      .optional(),
  ),
  customerEmail: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.email({ error: "Zadaj platný e-mail." }).max(200).optional(),
  ),
  customerPhone: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(40).optional(),
  ),
  note: optionalText,
  deliveryAddress: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().min(5).max(500).optional(),
  ),
  deliveryLat: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().finite().min(-90).max(90).optional(),
  ),
  deliveryLng: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().finite().min(-180).max(180).optional(),
  ),
  items: z
    .array(CartItemSchema)
    .min(1, { error: "Košík je prázdny." })
    .max(100),
}).superRefine((data, ctx) => {
  if (data.type === OrderType.DELIVERY && !data.deliveryAddress) {
    ctx.addIssue({
      code: "custom",
      message: "Pre donášku zadaj adresu doručenia.",
      path: ["deliveryAddress"],
    });
  }
  const hasLat = data.deliveryLat != null;
  const hasLng = data.deliveryLng != null;
  if (hasLat !== hasLng) {
    ctx.addIssue({
      code: "custom",
      message: "Súradnice doručenia musia byť zadané spolu.",
      path: ["deliveryLat"],
    });
  }
});

export type CartItemInput = z.infer<typeof CartItemSchema>;
export type CheckoutInput = z.infer<typeof CheckoutSchema>;

/** Povolené prechody životného cyklu objednávky (dopredu). */
export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

const STOCK_DEDUCTED_STATUSES: OrderStatus[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.COMPLETED,
];

/** Už bol zo skladu odpočítaný (po potvrdení objednávky)? */
export function orderHadStockDeducted(status: OrderStatus): boolean {
  return STOCK_DEDUCTED_STATUSES.includes(status);
}

/**
 * Predvolená voľba „vrátiť suroviny na sklad“ pri zrušení/refundácii.
 * Po začatí prípravy sa burger už nevracia — suroviny ostávajú ako spotreba.
 */
export function defaultRestoreStock(status: OrderStatus): boolean {
  return status === OrderStatus.CONFIRMED;
}
