import "server-only";

import { prisma } from "@/lib/prisma";
import { LOYALTY_MIN_PAID_SUBTOTAL } from "@/lib/loyalty/constants";
import type { CartItemInput } from "@/lib/orders/schemas";

export type ResolvedLoyaltyLine = {
  menuItemId: string;
  productId: string;
  nameSnapshot: string;
  quantity: number;
  loyaltyRewardId: string;
  /** Celkový počet bodov za riadok (pointsCost × quantity). */
  pointsRedeemed: number;
};

/** Overí pravidlá checkoutu, ak košík obsahuje vernostné odmeny. */
export function validateLoyaltyCheckout(params: {
  hasLoyaltyItems: boolean;
  paidSubtotal: number;
  customerId: string | null;
}): { ok: true } | { ok: false; message: string } {
  if (!params.hasLoyaltyItems) return { ok: true };
  if (!params.customerId) {
    return { ok: false, message: "Pre uplatnenie odmien sa prihlás." };
  }
  if (params.paidSubtotal < LOYALTY_MIN_PAID_SUBTOTAL) {
    return {
      ok: false,
      message: `Pre uplatnenie odmien musíš mať v košíku jedlo za minimálne ${LOYALTY_MIN_PAID_SUBTOTAL} €.`,
    };
  }
  return { ok: true };
}

/** Overí a rozparsuje jednu vernostnú položku košíka. */
export async function resolveLoyaltyCartItem(
  storeId: string,
  item: CartItemInput & { loyaltyRewardId: string },
): Promise<ResolvedLoyaltyLine | { error: string }> {
  const reward = await prisma.loyaltyReward.findFirst({
    where: {
      id: item.loyaltyRewardId,
      isActive: true,
      product: {
        isActive: true,
        choiceGroups: { none: {} },
        menuItems: {
          some: {
            id: item.menuItemId,
            storeId,
            isAvailable: true,
          },
        },
      },
    },
    select: {
      id: true,
      pointsCost: true,
      product: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!reward) {
    return {
      error:
        "Odmena už nie je dostupná. Obnov stránku a skús to znova.",
    };
  }

  return {
    menuItemId: item.menuItemId,
    productId: reward.product.id,
    nameSnapshot: reward.product.name,
    quantity: item.quantity,
    loyaltyRewardId: reward.id,
    pointsRedeemed: reward.pointsCost * item.quantity,
  };
}
