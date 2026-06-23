import "server-only";

import { prisma } from "@/lib/prisma";
import { LOYALTY_MAX_GRID_ITEMS } from "@/lib/loyalty/constants";
import type { LoyaltyRewardDTO } from "@/lib/loyalty/types";

/** Všetky odmeny pre admin (zoradené). */
export async function getLoyaltyRewards() {
  return prisma.loyaltyReward.findMany({
    orderBy: [{ sortOrder: "asc" }, { product: { name: "asc" } }],
    include: {
      product: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          isActive: true,
          category: { select: { name: true } },
          _count: { select: { choiceGroups: true } },
        },
      },
    },
  });
}

/**
 * Produkty vhodné ako odmena — aktívne, bez komba (žiadne choiceGroups),
 * ešte nie sú priradené ako odmena (okrem `excludeProductId` pri editácii).
 */
export async function getLoyaltyRewardProductOptions(excludeProductId?: string) {
  return prisma.product.findMany({
    where: {
      isActive: true,
      choiceGroups: { none: {} },
      ...(excludeProductId
        ? {
            OR: [{ loyaltyReward: null }, { id: excludeProductId }],
          }
        : { loyaltyReward: null }),
    },
    orderBy: [
      { category: { sortOrder: "asc" } },
      { category: { name: "asc" } },
      { name: "asc" },
    ],
    select: {
      id: true,
      name: true,
      category: { select: { name: true } },
    },
  });
}

/**
 * Aktívne odmeny dostupné v konkrétnej predajni (pre storefront).
 * Skryté: neaktívna odmena, neaktívny produkt, kombo, nedostupné menu.
 */
export async function getStoreLoyaltyRewards(
  storeId: string,
): Promise<LoyaltyRewardDTO[]> {
  const rewards = await prisma.loyaltyReward.findMany({
    where: {
      isActive: true,
      product: {
        isActive: true,
        choiceGroups: { none: {} },
        menuItems: {
          some: { storeId, isAvailable: true },
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { product: { name: "asc" } }],
    take: LOYALTY_MAX_GRID_ITEMS,
    select: {
      id: true,
      pointsCost: true,
      product: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          menuItems: {
            where: { storeId, isAvailable: true },
            take: 1,
            select: { id: true },
          },
        },
      },
    },
  });

  return rewards
    .filter((r) => r.product.menuItems[0])
    .map((r) => ({
      id: r.id,
      productId: r.product.id,
      menuItemId: r.product.menuItems[0]!.id,
      name: r.product.name,
      imageUrl: r.product.imageUrl,
      pointsCost: r.pointsCost,
    }));
}

export type LoyaltyRewardRow = Awaited<ReturnType<typeof getLoyaltyRewards>>[number];
