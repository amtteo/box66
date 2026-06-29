import { describe, expect, it } from "vitest";
import { OrderStatus } from "@/generated/prisma/enums";
import { shouldPlayOrderChime } from "@/lib/orders/should-play-order-chime";

describe("shouldPlayOrderChime", () => {
  it("plays on new order insert", () => {
    expect(
      shouldPlayOrderChime("INSERT", { status: OrderStatus.PENDING }, null),
    ).toBe(true);
  });

  it("plays when status moves to CONFIRMED or PREPARING", () => {
    expect(
      shouldPlayOrderChime(
        "UPDATE",
        { status: OrderStatus.CONFIRMED },
        { status: OrderStatus.PENDING },
      ),
    ).toBe(true);
    expect(
      shouldPlayOrderChime(
        "UPDATE",
        { status: OrderStatus.PREPARING },
        { status: OrderStatus.CONFIRMED },
      ),
    ).toBe(true);
  });

  it("ignores unrelated updates and deletes", () => {
    expect(
      shouldPlayOrderChime(
        "UPDATE",
        { status: OrderStatus.READY },
        { status: OrderStatus.PREPARING },
      ),
    ).toBe(false);
    expect(shouldPlayOrderChime("DELETE", null, null)).toBe(false);
  });
});
