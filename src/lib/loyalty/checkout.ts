import "server-only";

import { prisma } from "@/lib/prisma";
import { LOYALTY_MIN_PAID_SUBTOTAL } from "@/lib/loyalty/constants";
import { resolveCartChoices } from "@/lib/orders/resolve-choices";
import type { CartItemInput } from "@/lib/orders/schemas";
import type { ResolvedOrderChoice } from "@/lib/orders/resolve-choices";

export type ResolvedLoyaltyLine = {
  menuItemId: string;
  productId: string;
  nameSnapshot: string;
  quantity: number;
  loyaltyRewardId: string;
  pointsRedeemed: number;
  choices: ResolvedOrderChoice[];
};

type ChoiceContext = {
  optionByMenuItemId: Map<
    string,
    { productId: string; name: string; categoryId: string }
  >;
  optionIdsByCategory: Map<string, Set<string>>;
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
  choiceCtx: ChoiceContext,
): Promise<ResolvedLoyaltyLine | { error: string }> {
  const reward = await prisma.loyaltyReward.findFirst({
    where: {
      id: item.loyaltyRewardId,
      isActive: true,
      product: {
        isActive: true,
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
          choiceGroups: {
            select: {
              id: true,
              label: true,
              categoryId: true,
              minSelect: true,
              maxSelect: true,
            },
          },
        },
      },
    },
  });

  if (!reward) {
    return {
      error: "Odmena už nie je dostupná. Obnov stránku a skús to znova.",
    };
  }

  const resolvedChoices = resolveCartChoices({
    productName: reward.product.name,
    choiceGroups: reward.product.choiceGroups,
    clientChoices: item.choices,
    optionByMenuItemId: choiceCtx.optionByMenuItemId,
    optionIdsByCategory: choiceCtx.optionIdsByCategory,
  });
  if (!resolvedChoices.ok) {
    return { error: resolvedChoices.message };
  }

  return {
    menuItemId: item.menuItemId,
    productId: reward.product.id,
    nameSnapshot: reward.product.name,
    quantity: item.quantity,
    loyaltyRewardId: reward.id,
    pointsRedeemed: reward.pointsCost * item.quantity,
    choices: resolvedChoices.choices,
  };
}
