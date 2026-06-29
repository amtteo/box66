import { beforeAll, describe, expect, it } from "vitest";
import { buildApiCreateOrderRequest } from "@/lib/orders/api-order-payload";
import { OrderType, PaymentMethod } from "@/generated/prisma/enums";

const apiUrl = process.env.ORDER_API_URL?.replace(/\/$/, "");
const storeId =
  process.env.BOX66_TEST_STORE_ID ?? "019ecca0-24c8-72b8-b2e9-67d2173057df";
const menuItemId =
  process.env.BOX66_TEST_MENU_ITEM_ID ?? "019ed08d-24dd-735e-9682-6df66defaab5";

let apiReachable = false;

beforeAll(async () => {
  if (!apiUrl) return;
  try {
    const res = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(3000) });
    apiReachable = res.ok;
  } catch {
    apiReachable = false;
  }
});

const runIntegration = apiUrl ? describe : describe.skip;

runIntegration("checkout flow (Order API)", () => {
  it("creates a cash takeaway order via POST /stores/{id}/orders", async () => {
    if (!apiReachable) {
      console.warn("Order API nie je dostupný — preskakujem integračný test.");
      return;
    }

    const payload = buildApiCreateOrderRequest({
      checkout: {
        type: OrderType.TAKEAWAY,
        paymentMethod: PaymentMethod.CASH,
        customerName: "Vitest Checkout",
        customerEmail: "vitest@box66.sk",
      },
      orderLines: [
        {
          menuItemId,
          quantity: 1,
          note: null,
          choices: [],
        },
      ],
      customerId: null,
      deliveryAddress: null,
      deliveryDistanceKm: null,
    });

    const res = await fetch(`${apiUrl}/stores/${storeId}/orders`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(201);
    const order = (await res.json()) as {
      id: string;
      orderNumber: number;
      status: string;
      paymentStatus: string;
      items: unknown[];
    };
    expect(order.status).toBe("PENDING");
    expect(order.paymentStatus).toBe("UNPAID");
    expect(order.orderNumber).toBeGreaterThan(0);
    expect(order.items.length).toBeGreaterThan(0);
    expect(order.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("loads public menu via GET /stores/{id}/menu", async () => {
    if (!apiReachable) return;

    const res = await fetch(`${apiUrl}/stores/${storeId}/menu`, {
      headers: { Accept: "application/json" },
    });
    expect(res.status).toBe(200);
    const menu = (await res.json()) as { storeId: string; items: unknown[] };
    expect(menu.storeId).toBe(storeId);
    expect(menu.items.length).toBeGreaterThan(0);
  });
});
