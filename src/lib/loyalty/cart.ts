import type { CartLine } from "@/lib/orders/types";

/** Súčet bodov držaných v košíku (virtuálny hold). */
export function loyaltyPointsHeld(lines: CartLine[]): number {
  return lines.reduce(
    (sum, line) =>
      line.isLoyaltyReward && line.pointsCost
        ? sum + line.pointsCost * line.quantity
        : sum,
    0,
  );
}

export function loyaltyRewardLineId(rewardId: string): string {
  return `loyalty:${rewardId}`;
}

/** Subtotal platených položiek (bez vernostných odmien). */
export function paidSubtotal(lines: CartLine[]): number {
  return lines.reduce(
    (sum, line) =>
      line.isLoyaltyReward ? sum : sum + line.price * line.quantity,
    0,
  );
}

export function hasLoyaltyRewards(lines: CartLine[]): boolean {
  return lines.some((l) => l.isLoyaltyReward);
}
