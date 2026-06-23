import "server-only";

import { prisma } from "@/lib/prisma";
import { LOYALTY_MAX_GRID_ITEMS } from "@/lib/loyalty/constants";
import type { LoyaltyRewardDTO } from "@/lib/loyalty/types";
import type { MenuChoiceOptionDTO } from "@/lib/orders/types";

/** Možnosti výberu z pool kategórií dostupné v predajni. */
export async function loadStoreChoiceOptions(
  storeId: string,
  poolCategoryIds: string[],
): Promise<Map<string, MenuChoiceOptionDTO[]>> {
  const optionsByCategory = new Map<string, MenuChoiceOptionDTO[]>();
  if (poolCategoryIds.length === 0) return optionsByCategory;

  const optionItems = await prisma.menuItem.findMany({
    where: {
      storeId,
      isAvailable: true,
      product: {
        isActive: true,
        isComboOption: true,
        categoryId: { in: poolCategoryIds },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { product: { name: "asc" } }],
    select: {
      id: true,
      product: {
        select: { id: true, name: true, categoryId: true, imageUrl: true },
      },
    },
  });

  for (const oi of optionItems) {
    const list = optionsByCategory.get(oi.product.categoryId) ?? [];
    list.push({
      menuItemId: oi.id,
      productId: oi.product.id,
      name: oi.product.name,
      imageUrl: oi.product.imageUrl,
    });
    optionsByCategory.set(oi.product.categoryId, list);
  }

  return optionsByCategory;
}

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

/** Produkty vhodné ako odmena — ešte nie sú priradené ako odmena. */
export async function getLoyaltyRewardProductOptions(excludeProductId?: string) {
  return prisma.product.findMany({
    where: {
      isActive: true,
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
 */
export async function getStoreLoyaltyRewards(
  storeId: string,
): Promise<LoyaltyRewardDTO[]> {
  const rewards = await prisma.loyaltyReward.findMany({
    where: {
      isActive: true,
      product: {
        isActive: true,
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
          choiceGroups: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            select: {
              id: true,
              label: true,
              minSelect: true,
              maxSelect: true,
              categoryId: true,
            },
          },
          menuItems: {
            where: { storeId, isAvailable: true },
            take: 1,
            select: { id: true },
          },
        },
      },
    },
  });

  const poolCategoryIds = [
    ...new Set(
      rewards.flatMap((r) => r.product.choiceGroups.map((g) => g.categoryId)),
    ),
  ];
  const optionsByCategory = await loadStoreChoiceOptions(
    storeId,
    poolCategoryIds,
  );

  return rewards
    .filter((r) => r.product.menuItems[0])
    .map((r) => {
      const groupsWithOptions = r.product.choiceGroups.map((g) => ({
        id: g.id,
        label: g.label,
        minSelect: g.minSelect,
        maxSelect: g.maxSelect,
        options: optionsByCategory.get(g.categoryId) ?? [],
      }));
      const requiredGroups = groupsWithOptions.filter((g) => g.minSelect > 0);
      const requiresVariantChoice = requiredGroups.length > 0;
      const variantChoiceReady = requiredGroups.every((g) => g.options.length > 0);

      return {
        id: r.id,
        productId: r.product.id,
        menuItemId: r.product.menuItems[0]!.id,
        name: r.product.name,
        imageUrl: r.product.imageUrl,
        pointsCost: r.pointsCost,
        choiceGroups: groupsWithOptions.filter((g) => g.options.length > 0),
        requiresVariantChoice,
        variantChoiceReady,
      };
    });
}

export type LoyaltyRewardRow = Awaited<ReturnType<typeof getLoyaltyRewards>>[number];
