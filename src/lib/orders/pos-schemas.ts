import * as z from "zod";

import { OrderType, PaymentMethod } from "@/generated/prisma/enums";
import { CartItemSchema } from "@/lib/orders/schemas";

/** Platby pri pokladni — hotovosť alebo karta na mieste. */
export const POS_PAYMENT_METHODS = [
  PaymentMethod.CASH,
  PaymentMethod.CARD,
] as const;

/** Typy objednávky v pokladni (bez donášky). */
export const POS_ORDER_TYPES = [OrderType.TAKEAWAY, OrderType.DINE_IN] as const;

const optionalText = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().trim().max(200).optional(),
);

export const PosOrderSchema = z.object({
  storeId: z.uuid(),
  type: z.enum(POS_ORDER_TYPES),
  paymentMethod: z.enum(POS_PAYMENT_METHODS),
  items: z.array(CartItemSchema).min(1, "Košík je prázdny."),
  customerName: optionalText,
  note: optionalText,
});

export type PosOrderInput = z.infer<typeof PosOrderSchema>;
