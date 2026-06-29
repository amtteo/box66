import { describe, expect, it } from "vitest";
import { OrderType, PaymentMethod } from "@/generated/prisma/enums";
import { PosOrderSchema } from "@/lib/orders/pos-schemas";

const storeId = "019ecca0-24c8-72b8-b2e9-67d2173057df";
const menuItemId = "019ed08d-24dd-735e-9682-6df66defaab5";

describe("PosOrderSchema", () => {
  it("accepts cash takeaway order", () => {
    const result = PosOrderSchema.safeParse({
      storeId,
      type: OrderType.TAKEAWAY,
      paymentMethod: PaymentMethod.CASH,
      items: [{ menuItemId, quantity: 2, choices: [] }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects delivery and online payment", () => {
    expect(
      PosOrderSchema.safeParse({
        storeId,
        type: OrderType.DELIVERY,
        paymentMethod: PaymentMethod.CASH,
        items: [{ menuItemId, quantity: 1, choices: [] }],
      }).success,
    ).toBe(false);
    expect(
      PosOrderSchema.safeParse({
        storeId,
        type: OrderType.TAKEAWAY,
        paymentMethod: PaymentMethod.ONLINE,
        items: [{ menuItemId, quantity: 1, choices: [] }],
      }).success,
    ).toBe(false);
  });

  it("rejects empty cart", () => {
    expect(
      PosOrderSchema.safeParse({
        storeId,
        type: OrderType.DINE_IN,
        paymentMethod: PaymentMethod.CARD,
        items: [],
      }).success,
    ).toBe(false);
  });
});
