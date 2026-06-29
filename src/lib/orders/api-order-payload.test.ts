import { describe, expect, it } from "vitest";
import { buildApiCreateOrderRequest } from "@/lib/orders/api-order-payload";
import { OrderType, PaymentMethod } from "@/generated/prisma/enums";

describe("buildApiCreateOrderRequest", () => {
  it("maps checkout lines with choice groups and delivery distance", () => {
    const payload = buildApiCreateOrderRequest({
      checkout: {
        type: OrderType.DELIVERY,
        paymentMethod: PaymentMethod.CARD,
        customerName: "Ján",
        customerEmail: "jan@example.com",
        customerPhone: "+421900000000",
        note: "Bez cibule",
      },
      customerId: "cust-1",
      deliveryAddress: "Hlavná 1",
      deliveryDistanceKm: 5.2,
      orderLines: [
        {
          menuItemId: "menu-1",
          quantity: 2,
          note: null,
          choices: [
            {
              groupId: "grp-1",
              groupLabel: "Príloha",
              productId: "prod-2",
              menuItemId: "menu-2",
              nameSnapshot: "Ryža",
            },
          ],
        },
      ],
    });

    expect(payload.type).toBe("DELIVERY");
    expect(payload.paymentMethod).toBe("CARD");
    expect(payload.customerId).toBe("cust-1");
    expect(payload.deliveryAddress).toBe("Hlavná 1");
    expect(payload.deliveryDistanceKm).toBe("5.2");
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0].choices).toEqual([
      {
        groupId: "grp-1",
        productId: "prod-2",
        menuItemId: "menu-2",
        groupLabel: "Príloha",
        nameSnapshot: "Ryža",
      },
    ]);
  });

  it("includes loyaltyRewardId on reward lines", () => {
    const payload = buildApiCreateOrderRequest({
      checkout: {
        type: OrderType.TAKEAWAY,
        paymentMethod: PaymentMethod.ONLINE,
      },
      customerId: "cust-1",
      deliveryAddress: null,
      deliveryDistanceKm: null,
      orderLines: [
        {
          menuItemId: "menu-paid",
          quantity: 1,
          note: null,
          choices: [],
        },
        {
          menuItemId: "menu-reward",
          quantity: 1,
          note: null,
          choices: [],
          loyaltyRewardId: "reward-1",
        },
      ],
    });

    expect(payload.items[1].loyaltyRewardId).toBe("reward-1");
    expect(payload.items[0].loyaltyRewardId).toBeUndefined();
  });
});
